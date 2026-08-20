const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

const PORT = process.env.PORT || 3000;


// ============================================================
// RENDER PROXY
// ============================================================

app.set("trust proxy", 1);


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "gcs_secret_key_987654",
        resave: false,
        saveUninitialized: false,

        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);


// ============================================================
// STATIC FILES
// ============================================================

app.use(
    express.static(
        path.join(__dirname, "public"),
        {
            index: false
        }
    )
);


// ============================================================
// LOGIN PAGE
// ============================================================

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        server: "GCS Server"
    });
});

app.get("/", (req, res) => {

    if (req.session.loggedIn) {

        return res.redirect("/dashboard");

    }

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "login.html"
        )
    );
});


// ============================================================
// LOGIN
// ============================================================

app.post("/login", (req, res) => {

    const {
        username,
        password
    } = req.body;


    console.log("Login attempt:", username);


    if (
        username === "admin" &&
        password === "1234"
    ) {

        req.session.loggedIn = true;


        // Make sure session is saved before response
        req.session.save((err) => {

            if (err) {

                console.error(
                    "Session save error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Session error"
                });
            }


            console.log(
                "Login successful - session saved"
            );


            res.json({
                success: true
            });

        });

        return;
    }


    console.log("Invalid login");


    res.status(401).json({
        success: false,
        message: "Invalid username or password"
    });

});


// ============================================================
// DASHBOARD
// ============================================================

app.get("/dashboard", (req, res) => {

    console.log(
        "Dashboard session:",
        req.session.loggedIn
    );


    if (!req.session.loggedIn) {

        console.log(
            "Not logged in -> redirecting to login"
        );

        return res.redirect("/");

    }


    console.log(
        "Dashboard access granted"
    );


    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ============================================================
// LOGOUT
// ============================================================

app.post("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            return res.status(500).json({
                success: false
            });

        }


        res.clearCookie("connect.sid");


        res.json({
            success: true
        });

    });

});


// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/health", (req, res) => {

    res.json({
        status: "OK",
        server: "GCS Server"
    });

});


// ============================================================
// SERVER
// ============================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);