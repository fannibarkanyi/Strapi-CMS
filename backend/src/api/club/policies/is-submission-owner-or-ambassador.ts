export default async (policyContext, config, { strapi }) => {
    const currentUser = policyContext.state.user;
    const clubId = policyContext.params.id;

    if (!currentUser || typeof clubId === 'undefined') {
        return false;
    }

    if (currentUser.role?.type === 'ambassador') {
        return true;
    }

    const club = await strapi.documents('api::club.club').findOne({
        documentId: clubId,
        status: 'draft',
        populate: {
            owner: {
                fields: ['documentId']
            }
        }
    });

    if (!club) {
        return false;
    }

    return club.owner?.documentId === currentUser.documentId;
};
