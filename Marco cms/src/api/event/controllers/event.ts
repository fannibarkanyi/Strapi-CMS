/**
 * event controller
 *
 * Events can be marked public (is_public: true) or private. Private events
 * are only visible to signed-in (authenticated) users - anonymous requests
 * never see them, whether listing or fetching by id.
 *
 * Events also go through a submission/review workflow: students submit new
 * events which stay unpublished with review_status "Sent" until an
 * Ambassador approves (publishes) or declines them. Students may only ever
 * see their own pending/declined drafts, never another student's.
 */

import { factories } from '@strapi/strapi';

const UID = 'api::event.event';

export default factories.createCoreController(UID, ({ strapi }) => ({
    async find(ctx) {
        const isAmbassador = ctx.state.user?.role?.type === 'ambassador';

        if (!ctx.state.user) {
            const existingFilters = ctx.query.filters as Record<string, unknown> | undefined;
            ctx.query = {
                ...ctx.query,
                filters: {
                    $and: [
                        ...(existingFilters ? [existingFilters] : []),
                        { is_public: true },
                    ],
                },
            };
        }

        // Non-ambassadors listing drafts only ever get their own - but a
        // relation filter/populate targeting plugin::users-permissions.user
        // would fail content-API validation (needs "User: find", which we
        // don't grant). So we let the query through unfiltered/unpopulated on
        // that field, then narrow the results with a trusted, unrestricted
        // documents() lookup per item instead.
        const wantsOwnDrafts = ctx.query.status === 'draft' && ctx.state.user && !isAmbassador;
        if (wantsOwnDrafts) {
            const populate = { ...(ctx.query.populate as Record<string, unknown> | undefined) };
            delete populate.submitted_by;
            ctx.query = { ...ctx.query, populate };
        }

        const { data, meta } = await super.find(ctx);

        if (wantsOwnDrafts) {
            const owned = [];
            for (const item of data) {
                const full = await strapi.documents(UID).findOne({
                    documentId: item.documentId,
                    status: 'draft',
                    populate: { submitted_by: { fields: ['documentId'] } },
                });
                if (full?.submitted_by?.documentId === ctx.state.user!.documentId) {
                    owned.push(item);
                }
            }
            return { data: owned, meta };
        }

        return { data, meta };
    },

    async findOne(ctx) {
        const isAmbassador = ctx.state.user?.role?.type === 'ambassador';

        if (ctx.query.status === 'draft' && !isAmbassador && ctx.state.user) {
            const existing = await strapi.documents(UID).findOne({
                documentId: ctx.params.id,
                status: 'draft',
                populate: { submitted_by: { fields: ['documentId'] } },
            });

            if (existing && existing.submitted_by?.documentId !== ctx.state.user.documentId) {
                return ctx.forbidden('You can only view your own pending submissions.');
            }
        }

        const { data, meta } = await super.findOne(ctx);

        if (data && data.is_public === false && !ctx.state.user) {
            return ctx.forbidden('You must be signed in to view this event.');
        }

        return { data, meta };
    },

    async create(ctx) {
        const isAmbassador = ctx.state.user.role?.type === 'ambassador';
        const data = ctx.request.body.data ?? {};

        // Writing a relation to plugin::users-permissions.user via the content
        // API requires "find" permission on User, which we don't grant (it
        // would also expose /api/users). So we strip it here and set it right
        // after creation via a trusted, unrestricted documents() call instead.
        const requestedSubmitter = data.submitted_by;
        delete data.submitted_by;

        if (!isAmbassador) {
            data.review_status = 'Sent';
            ctx.query = { ...ctx.query, status: 'draft' };
        }

        ctx.request.body.data = data;
        const result = await super.create(ctx);

        const created = (result as { data?: { documentId?: string } })?.data;
        if (created?.documentId) {
            await strapi.documents(UID).update({
                documentId: created.documentId,
                status: isAmbassador ? 'published' : 'draft',
                data: { submitted_by: requestedSubmitter || ctx.state.user.id },
            });
        }

        return result;
    },

    async update(ctx) {
        const isAmbassador = ctx.state.user.role?.type === 'ambassador';
        const data = ctx.request.body.data ?? {};
        delete data.submitted_by;

        if (!isAmbassador) {
            delete data.review_status;
            ctx.query = { ...ctx.query, status: 'draft' };

            const existing = await strapi.documents(UID).findOne({
                documentId: ctx.params.id,
                status: 'draft',
                fields: ['review_status'],
            });

            if (existing?.review_status === 'Declined') {
                data.review_status = 'Sent';
            }
        }

        ctx.request.body.data = data;
        return super.update(ctx);
    },

    async approve(ctx) {
        const { id } = ctx.params;
        const updated = await strapi.documents(UID).update({
            documentId: id,
            status: 'published',
            data: { review_status: 'Approved' },
        });
        ctx.body = { data: updated };
    },

    async decline(ctx) {
        const { id } = ctx.params;
        const updated = await strapi.documents(UID).update({
            documentId: id,
            data: { review_status: 'Declined' },
        });
        ctx.body = { data: updated };
    },
}));
