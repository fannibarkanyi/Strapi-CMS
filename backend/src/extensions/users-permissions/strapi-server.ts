/**
 * Overrides the users-permissions plugin's `me` action so it returns the
 * role that the auth strategy already resolved onto ctx.state.user, instead
 * of re-fetching + content-API-sanitizing the user (which strips the role
 * relation unless the caller's role has "User: find" permission - and we
 * don't want to grant that broadly, since it would also expose /api/users
 * to every logged-in account).
 */

export default (plugin: any) => {
    plugin.controllers.user.me = async (ctx: any) => {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized();
        }

        ctx.body = {
            id: user.id,
            documentId: user.documentId,
            username: user.username,
            email: user.email,
            role: user.role
                ? { name: user.role.name, type: user.role.type }
                : null,
        };
    };

    return plugin;
};
