router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'suggestions',
                populate: { path: 'upvotes' }
            });
        res.render('profile', { user });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { error: 'An error occurred while loading the profile' });
    }
});