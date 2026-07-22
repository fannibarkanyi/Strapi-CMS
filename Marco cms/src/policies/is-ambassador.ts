export default async (policyContext) => {
    const currentUser = policyContext.state.user;

    return currentUser?.role?.type === 'ambassador';
};
