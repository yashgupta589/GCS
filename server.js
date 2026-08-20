const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

const PORT = process.env.PORT || 3000;


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "gcs_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production"
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

app.get("/", (req, res) => {

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


    // Temporary login
    if (
        username === "admin" &&
        password === "1234"
    ) {

        req.session.loggedIn = true;

        return res.json({
            success: true
        });

    }


    res.status(401).json({
        success: false,
        message: "Invalid username or password"
    });

});


// ============================================================
// DASHBOARD
// ============================================================

app.get("/dashboard", (req, res) => {

    if (!req.session.loggedIn) {

        return res.redirect("/");

    }


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

    req.session.destroy(err => {

        if (err) {

            return res.status(500).json({
                success: false
            });

        }


        res.json({
            success: true
        });

    });

});


// ============================================================
// SERIAL STATUS
// ============================================================

// IMPORTANT:
// SerialPort is NOT used on Render.
// Browser handles ESP32 connection using Web Serial API.

app.get("/serial-status", (req, res) => {

    res.json({
        success: true,
        message: "Serial connection is handled by browser"
    });

});


// ============================================================
// TELEMETRY API
// ============================================================

// Your latest data.js receives ESP32 data directly
// through navigator.serial.
//
// Therefore this API does not read COM port on Render.

let latestPacket = "";


// Optional API to store latest packet
app.post("/api/data", (req, res) => {

    try {

        const {
            packet
        } = req.body;


        if (typeof packet !== "string") {

            return res.status(400).json({
                success: false,
                message: "Invalid packet"
            });

        }


        latestPacket = packet;


        res.json({
            success: true
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ============================================================
// GET LATEST DATA
// ============================================================

app.get("/api/data", (req, res) => {

    if (!latestPacket) {

        return res.json({
            values: []
        });

    }


    const values = latestPacket
        .replace("(", "")
        .replace(")", "")
        .split(",")
        .map(value => value.trim());


    res.json({
        values: values
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