/**
 * club router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::club.club', {
    config: {
        delete: {
            policies: ['is-owner'],
        },
        update: {
            policies: ['is-submission-owner-or-ambassador'],
        }
    }
});