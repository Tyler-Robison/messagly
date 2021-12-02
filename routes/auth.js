const express = require("express");
const router = new express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Message = require("../models/message");

const ExpressError = require("../expressError");
const db = require("../db");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body
        if (!username || !password) throw new ExpressError('Must enter user/pass', 400)

        // authentic = true if valid login, false otherwise
        const authentic = await User.authenticate(username, password)
        
        if (authentic) {
            const token = User.generateToken(username)
            // console.log('token test', token)
            return res.json({ message: 'logged in!', token });
        } else {
            throw new ExpressError('Invalid username/Password', 400)
        }

    } catch (err) {
        return next(err)
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body
        if (!username || !password || !first_name || !last_name || !phone) throw new ExpressError('Must enter all info', 400)


        const result = await User.register({ username, password, first_name, last_name, phone })
        const token = User.generateToken(username)
        // console.log('result', result)

        return res.json({ message: "Succesfully Registered", username: result.username, token })
    } catch (err) {
        if (err.code === '23505') {
            return next(new ExpressError('username taken', 400));
        }

        return next(err)
    }
})

module.exports = router;
