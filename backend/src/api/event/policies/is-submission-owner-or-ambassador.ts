export default async (policyContext, config, { strapi }) => {
    const currentUser = policyContext.state.user;
    const eventId = policyContext.params.id;

    if (!currentUser || typeof eventId === 'undefined') {
        return false;
    }

    if (currentUser.role?.type === 'ambassador') {
        return true;
    }

    const event = await strapi.documents('api::event.event').findOne({
        documentId: eventId,
        status: 'draft',
        populate: {
            submitted_by: {
                fields: ['documentId']
            }
        }
    });

    if (!event) {
        return false;
    }

    return event.submitted_by?.documentId === currentUser.documentId;
};
