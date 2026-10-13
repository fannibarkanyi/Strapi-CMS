/**
 * Custom routes for the Ambassador review workflow.
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/articles/:id/approve',
            handler: 'article.approve',
            config: {
                policies: ['global::is-ambassador'],
            },
        },
        {
            method: 'POST',
            path: '/articles/:id/decline',
            handler: 'article.decline',
            config: {
                policies: ['global::is-ambassador'],
            },
        },
    ],
};
