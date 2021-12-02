const express = require("express");

const User = require("../models/user");
const Message = require("../models/message");
const ExpressError = require("../expressError")
const router = new express.Router();

const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in user is either the to or from user.
 *
 **/

router.get('/:msgId', ensureLoggedIn, async (req, res, next) => {
    try {
        const { msgId } = req.params;
        const username = req.user.username;
        const message = await Message.get(msgId)
        if (message.to_user.username !== username && message.from_user.username !== username) {
            throw new ExpressError("Cannot read this message", 401);
        }

        return res.json({ message })

    } catch (err) {
        return next(err)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const { to_username, body } = req.body;
        const from_username = req.user.username
        const message = await Message.create({ from_username, to_username, body })

        return res.json({ message })

    } catch (err) {
        // If user being sent to doesn't exist give this error. 
        if (err.code === '23503') {
            return next(new ExpressError(`User ${req.user.username} does not exist.`, 400));
        }
        next(err)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:msgId/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const { msgId } = req.params;
        const username = req.user.username;
        let msg = await Message.get(msgId);

        if (msg.to_user.username !== username) {
            throw new ExpressError("Cannot read this message", 401);
        }

        const message = await Message.markRead(msgId)

        return res.json({ message: 'Message Read' })

    } catch (err) {
        return next(err)
    }
})

module.exports = router;