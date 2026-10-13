export default async (policyContext, config, { strapi }) => {
    const currentUser = policyContext.state.user;
    const clubId = policyContext.params.id;

    if (!currentUser || typeof clubId === 'undefined') {
        return false;
    }

    const club = await strapi.documents('api::club.club').findOne({
        documentId: clubId,
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
