/**
 * Custom routes for the Ambassador review workflow.
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/events/:id/approve',
            handler: 'event.approve',
            config: {
                policies: ['global::is-ambassador'],
            },
        },
        {
            method: 'POST',
            path: '/events/:id/decline',
            handler: 'event.decline',
            config: {
                policies: ['global::is-ambassador'],
            },
        },
    ],
};
