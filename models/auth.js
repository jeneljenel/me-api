/**
* module auth
* register and login user
*/
"use strict";


//Database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/texts.sqlite');

// Handle hashing password
const bcrypt = require('bcryptjs');
const saltRounds = 10;

//JWT
const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = {
    registerUser: function (res, body) {
        const aName = body.aName;
        const aEmail = body.aEmail;
        const bName = body.bName;
        const bEmail = body.bEmail;
        const birthday = body.birthday;
        const password = body.password;

        let sql = "INSERT INTO users (aName, aEmail, bName, bEmail, birthday, password) VALUES(?, ?, ?, ?, ?, ?);"

        if (!aEmail || !bEmail || !password) {
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: "/register",
                    title: "Email or password missing",
                    detail: "Email or password missing in request",
                }
            });
        }

        let params = [aName, aEmail, bName, bEmail, birthday];
        console.log(params);

        bcrypt.hash(password, saltRounds, function(err, hash){
            if (err) {
                return res.status(500).json({
                    errors: {
                        status: 500,
                        source: "/register",
                        title: "bcrypt error",
                        detail: "bcrypt error"
                    }
                });
            }
            params.push(hash);

            db.run(sql,
                params,
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            errors: {
                                status: 500,
                                source: "/register",
                                title: "Database error",
                                detail: err.message
                            }   
                        })
                    }

                    return res.status(201).json({
                        data: {
                            msg: "form succesfully registered!"
                        }
                    })
                }
                )
        })
    },

    loginUser: function(res, body) {
        const userEmail = body.email;
        const userPassword = body.password;

        let sql = "SELECT * FROM 'users' WHERE aEmail IS (?);";
        
        if (!userEmail || !userPassword) {
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: "/login",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            });
        }

        db.each(
            sql,
            userEmail,
            (err, userfound) => {
                if (err) {
                    return res.status(500).json({
                        errors: {
                            status: 500,
                            source: "/login",
                            title: "Database error",
                            detail: err.message
                        }
                    });
                }

                if (userfound === undefined) {
                    return res.status(401).json({
                        errors: {
                            status: 401,
                            source: "/login",
                            title: "User not found",
                            detail: "User with provided email not found."
                        }
                    });
                }

                const user = userfound;
                bcrypt.compare(
                    userPassword, user.password, 
                    (err, result) => {
                        if (err) {
                            
                            return res.status(500).json({
                                errors: {
                                    status: 500,
                                    source: "/login",
                                    title: "bcrypt error",
                                    detail: "bcrypt error"
                                }
                            });
                        }


                        if (result) {
                            console.log(userEmail);
                            let payload = {email: userEmail};
                            let secret = process.env.JWT_SECRET;
                            let token = jwt.sign(payload, secret, { expiresIn: '1h' });
                            res.cookie('token', token, { httpOnly: true })
                            return res.status(200).json({
                                data: {
                                    type: "success",
                                    message: "User logged in",
                                    user: payload,
                                    token: token
                                }
                            });
                            
                        }

                        return res.status(401).json({
                            errors: {
                                status: 401,
                                source: "/login",
                                title: "Wrong password",
                                detail: "Password is incorrect."
                            }
                        });

                });
            }
        )

    }
}


module.exports = auth;