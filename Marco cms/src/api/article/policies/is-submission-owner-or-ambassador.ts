export default async (policyContext, config, { strapi }) => {
    const currentUser = policyContext.state.user;
    const articleId = policyContext.params.id;

    if (!currentUser || typeof articleId === 'undefined') {
        return false;
    }

    if (currentUser.role?.type === 'ambassador') {
        return true;
    }

    const article = await strapi.documents('api::article.article').findOne({
        documentId: articleId,
        status: 'draft',
        populate: {
            author: {
                fields: ['documentId']
            }
        }
    });

    if (!article) {
        return false;
    }

    return article.author?.documentId === currentUser.documentId;
};
