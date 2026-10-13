import { factories } from '@strapi/strapi';

const UID = 'api::club.club';

export default factories.createCoreController(UID, ({ strapi }) => ({
    async find(ctx) {
        const isAmbassador = ctx.state.user?.role?.type === 'ambassador';

        const wantsOwnDrafts = ctx.query.status === 'draft' && ctx.state.user && !isAmbassador;
        if (wantsOwnDrafts) {
            const populate = { ...(ctx.query.populate as Record<string, unknown> | undefined) };
            delete populate.owner;
            ctx.query = { ...ctx.query, populate };
        }

        const { data, meta } = await super.find(ctx);

        if (wantsOwnDrafts) {
            const owned = [];
            for (const item of data) {
                const full = await strapi.documents(UID).findOne({
                    documentId: item.documentId,
                    status: 'draft',
                    populate: { owner: { fields: ['documentId'] } },
                });
                if (full?.owner?.documentId === ctx.state.user!.documentId) {
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
                populate: { owner: { fields: ['documentId'] } },
            });

            if (existing && existing.owner?.documentId !== ctx.state.user.documentId) {
                return ctx.forbidden('You can only view your own pending submissions.');
            }
        }

        return super.findOne(ctx);
    },

    async create(ctx) {
        const isAmbassador = ctx.state.user.role?.type === 'ambassador';
        const data = ctx.request.body.data ?? {};

        const requestedOwner = data.owner;
        delete data.owner;

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
                data: { owner: requestedOwner || ctx.state.user.id },
            });
        }

        return result;
    },

    async update(ctx) {
        const isAmbassador = ctx.state.user.role?.type === 'ambassador';
        const data = ctx.request.body.data ?? {};
        delete data.owner;

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
