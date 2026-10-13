/**
 * event router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::event.event', {
    config: {
        update: {
            policies: ['is-submission-owner-or-ambassador'],
        },
    },
});
