/** User class for message.ly */
const db = require("../db");
const Message = require("./message");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    // user/pass etc all undef
    // debugger;

    const hashedPwd = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
    VALUES ($1, $2, $3, $4, $5, current_timestamp)
    RETURNING username, password`,
      [username, hashedPwd, first_name, last_name, phone])
    // result.rows only contains user/pass b/c that is all we're returning.
    // console.log('result', result.rows)
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */


  static async authenticate(username, password) {

    const result = await db.query(`
    SELECT username, password
    FROM users
    WHERE username = $1`, [username])

    const user = result.rows[0]
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        return true
      } else {
        return false
      }
    }
  }

  static generateToken(username) {
    const token = jwt.sign({ username }, SECRET_KEY);
    return token
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users SET last_login_at=current_timestamp
      WHERE username = $1`, [username]
    )

    // may have to RETURNING to have anything here.
    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone FROM users`
    )

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username=$1`, [username]
    )

    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
      FROM users
      JOIN messages ON messages.from_username = users.username 
      WHERE username=$1`, [username]
    )
    // console.log('result', result.rows)
    const msgArr = [];
    // to_user has to be an obj containing username/first/last/phone 
    // of user message was sent to

    for (let i = 0; i < result.rows.length; i++) {
      const toUser = result.rows[i].to_username
      const userResult = await db.query(
        `SELECT username, first_name, last_name, phone 
        FROM users
        WHERE username =$1`, [toUser]
      )

      result.rows[i].to_user = userResult.rows[0]
      delete result.rows[i].to_username
      msgArr.push(result.rows[i])
    }

    return msgArr
  }


  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT id, from_username, body, sent_at, read_at
      FROM users
      JOIN messages ON messages.to_username = users.username 
      WHERE username=$1`, [username]
    )
    // console.log('result', result.rows)
    const msgArr = [];
    // from_user has to be an obj containing username/first/last/phone 
    // of user message was sent from

    for (let i = 0; i < result.rows.length; i++) {
      const toUser = result.rows[i].from_username
      const userResult = await db.query(
        `SELECT username, first_name, last_name, phone 
        FROM users
        WHERE username =$1`, [toUser]
      )

      result.rows[i].from_user = userResult.rows[0]
      delete result.rows[i].from_username
      msgArr.push(result.rows[i])
    }

    return msgArr
  }
}


module.exports = User;