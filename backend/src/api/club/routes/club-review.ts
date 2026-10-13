/**
 * Custom routes for the Ambassador review workflow.
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/clubs/:id/approve',
            handler: 'club.approve',
            config: {
                policies: ['global::is-ambassador'],
            },
        },
        {
            method: 'POST',
            path: '/clubs/:id/decline',
            handler: 'club.decline',
            config: {
                policies: ['global::is-ambassador'],
            },
        },
    ],
};
