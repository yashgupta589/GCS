// ============================================================
// GLOBAL VARIABLES
// ============================================================

let values = [];
let flag = false;
let port = null;
let writer = null;
let reader = null;
let x = 0;


// ============================================================
// SERIAL MONITOR - SEND DATA TO ESP32
// ============================================================

async function serialMonitor(data) {

    try {

        if (!port || !port.writable) {
            console.log("Serial port is not connected");
            return;
        }

        if (!writer) {
            writer = port.writable.getWriter();
        }

        await writer.write(
            new TextEncoder().encode(data + "\n")
        );

        console.log("Sent:", data);

    }
    catch (err) {
        console.error("Serial Write Error:", err);
    }
}


// ============================================================
// SERIAL INPUT / TEXTAREA
// ============================================================

const serial = document.getElementById("serial");

if (serial) {

    serial.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            const msg = serial.value.trim();

            if (msg.length > 0) {

                serialMonitor(msg);

                serial.value = "";
            }
        }
    });
}


// ============================================================
// LINE BREAK TRANSFORMER
// ============================================================

class LineBreakTransformer {

    constructor() {
        this.container = "";
    }

    transform(chunk, controller) {

        this.container += chunk;

        const lines = this.container.split(/\r?\n/);

        this.container = lines.pop();

        lines.forEach(line => {

            if (line.trim() !== "") {
                controller.enqueue(line.trim());
            }

        });
    }

    flush(controller) {

        if (this.container.trim() !== "") {
            controller.enqueue(this.container.trim());
        }
    }
}


// ============================================================
// CONNECT SERIAL PORT
// ============================================================

async function connectPort() {

    try {

        if (!("serial" in navigator)) {

            alert(
                "Web Serial API is not supported.\n" +
                "Please use Google Chrome or Microsoft Edge."
            );

            return;
        }


        // Ask user to select COM port
        port = await navigator.serial.requestPort();


        // Open port
        await port.open({
            baudRate: 115200
        });


        flag = true;


        // Update status
        const status = document.getElementById("status");

        if (status) {

            status.innerText = "Connected";

            status.style.color = "lime";
        }


        console.log("Serial Port Connected");


        // ----------------------------------------------------
        // SERIAL READER
        // ----------------------------------------------------

        const decoder = new TextDecoderStream();

        const inputDone = port.readable.pipeTo(
            decoder.writable
        );


        const lineStream = decoder.readable.pipeThrough(
            new TransformStream(
                new LineBreakTransformer()
            )
        );


        reader = lineStream.getReader();


        // ----------------------------------------------------
        // READ LOOP
        // ----------------------------------------------------

        while (true) {

            const { value, done } = await reader.read();


            if (done) {
                break;
            }


            if (value) {

                console.log("Serial Data:", value);


                // ------------------------------------------------
                // Convert received data into array
                // ------------------------------------------------

                const received = value.trim();


                if (received.length > 0) {

                    values = received.split(",");

                    console.log("Values:", values);
                }
            }
        }

    }
    catch (err) {

        console.error("Serial Connection Error:", err);

        flag = false;

        const status = document.getElementById("status");

        if (status) {

            status.innerText = "Connection Failed";

            status.style.color = "red";
        }
    }
}


// ============================================================
// DISCONNECT SERIAL PORT
// ============================================================

async function disconnectPort() {

    try {

        // Stop reader
        if (reader) {

            try {
                await reader.cancel();
            }
            catch (err) {
                console.log("Reader cancel:", err);
            }

            reader.releaseLock();

            reader = null;
        }


        // Release writer
        if (writer) {

            try {
                writer.releaseLock();
            }
            catch (err) {
                console.log("Writer release:", err);
            }

            writer = null;
        }


        // Close port
        if (port) {

            try {
                await port.close();
            }
            catch (err) {
                console.log("Port close:", err);
            }

            port = null;
        }


        flag = false;


        const status = document.getElementById("status");

        if (status) {

            status.innerText = "Disconnected";

            status.style.color = "orange";
        }


        console.log("Serial Port Disconnected");

    }
    catch (err) {

        console.error("Disconnect Error:", err);
    }
}


// ============================================================
// CREATE NORMAL CHART
// ============================================================

function createChart(id, label) {

    const canvas = document.getElementById(id);


    if (!canvas) {

        console.error(
            `Canvas with id "${id}" not found`
        );

        return null;
    }


    return new Chart(
        canvas,
        {

            type: "line",

            data: {

                labels: [],

                datasets: [

                    {

                        label: label,

                        data: [],

                        borderColor: "yellow",

                        backgroundColor: "yellow",

                        borderWidth: 2,

                        pointRadius: 0,

                        tension: 0.3
                    }

                ]
            },


            options: {

                responsive: true,

                animation: false,


                plugins: {

                    legend: {

                        labels: {

                            color: "white"
                        }
                    }
                },


                scales: {

                    x: {

                        ticks: {

                            color: "white"
                        }
                    },


                    y: {

                        ticks: {

                            color: "white"
                        }
                    }
                }
            }
        }
    );
}


// ============================================================
// CREATE CHARTS
// ============================================================

const altChart =
    createChart("altChart", "Altitude");

const presChart =
    createChart("presChart", "Pressure");

const currChart =
    createChart("currChart", "Current");

const voltChart =
    createChart("voltChart", "Voltage");


// ============================================================
// ACCELERATION CHART
// ============================================================

let accChart = null;

const accCanvas =
    document.getElementById("accChart");


if (accCanvas) {

    accChart = new Chart(

        accCanvas,

        {

            type: "line",

            data: {

                labels: [],

                datasets: [

                    {

                        label: "Acc X",

                        data: [],

                        borderColor: "red",

                        backgroundColor: "red",

                        borderWidth: 1,

                        tension: 0,

                        pointRadius: 0
                    },


                    {

                        label: "Acc Y",

                        data: [],

                        borderColor: "blue",

                        backgroundColor: "blue",

                        borderWidth: 1,

                        tension: 0.3,

                        pointRadius: 0
                    },


                    {

                        label: "Acc Z",

                        data: [],

                        borderColor: "orange",

                        backgroundColor: "orange",

                        borderWidth: 1,

                        tension: 0.3,

                        pointRadius: 0
                    }
                ]
            },


            options: {

                responsive: true,

                animation: false,


                plugins: {

                    legend: {

                        labels: {

                            color: "white"
                        }
                    }
                },


                scales: {

                    x: {

                        ticks: {

                            color: "white"
                        }
                    },


                    y: {

                        ticks: {

                            color: "white"
                        }
                    }
                }
            }
        }
    );
}


// ============================================================
// ADD NORMAL CHART POINT
// ============================================================

function addPoint(chart, value) {

    if (!chart) {
        return;
    }


    if (!Number.isFinite(value)) {
        return;
    }


    chart.data.labels.push(x);

    chart.data.datasets[0].data.push(value);


    // Maximum 30 points
    if (chart.data.labels.length > 30) {

        chart.data.labels.shift();

        chart.data.datasets[0].data.shift();
    }


    chart.update("none");
}


// ============================================================
// ADD ACCELERATION POINT
// ============================================================

function addAccPoint(ax, ay, az) {

    if (!accChart) {
        return;
    }


    if (
        !Number.isFinite(ax) ||
        !Number.isFinite(ay) ||
        !Number.isFinite(az)
    ) {

        return;
    }


    accChart.data.labels.push(x);


    accChart.data.datasets[0].data.push(ax);

    accChart.data.datasets[1].data.push(ay);

    accChart.data.datasets[2].data.push(az);


    // Maximum 30 points
    if (accChart.data.labels.length > 30) {

        accChart.data.labels.shift();

        accChart.data.datasets[0].data.shift();

        accChart.data.datasets[1].data.shift();

        accChart.data.datasets[2].data.shift();
    }


    accChart.update("none");
}


// ============================================================
// SAFE VALUE FUNCTION
// ============================================================

function getValue(index) {

    if (
        !Array.isArray(values) ||
        values[index] === undefined ||
        values[index] === null ||
        values[index] === ""
    ) {

        return "---";
    }


    return values[index].trim();
}


// ============================================================
// SET ELEMENT VALUE
// ============================================================

function setValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.innerText = value;
    }
}


// ============================================================
// UPDATE DASHBOARD
// ============================================================

async function updateData() {

    try {

        // ----------------------------------------------------
        // IMPORTANT
        // Do not access values[0] if values is empty
        // ----------------------------------------------------

        if (
            !Array.isArray(values) ||
            values.length === 0
        ) {

            return;
        }


        // ----------------------------------------------------
        // DASHBOARD DATA
        // ----------------------------------------------------

        setValue(
            "missionTime",
            getValue(0)
        );


        setValue(
            "packetCount",
            getValue(1)
        );


        setValue(
            "altitude",
            getValue(2)
        );


        setValue(
            "pressure",
            getValue(3)
        );


        setValue(
            "current",
            getValue(4)
        );


        setValue(
            "voltage",
            getValue(5)
        );


        setValue(
            "latitude",
            getValue(6)
        );


        setValue(
            "longitude",
            getValue(7)
        );


        setValue(
            "accX",
            getValue(8)
        );


        setValue(
            "accY",
            getValue(9)
        );


        setValue(
            "accZ",
            getValue(10)
        );


        setValue(
            "magX",
            getValue(11)
        );


        setValue(
            "magY",
            getValue(12)
        );


        setValue(
            "magZ",
            getValue(13)
        );


        setValue(
            "gyroX",
            getValue(14)
        );


        setValue(
            "gyroY",
            getValue(15)
        );


        setValue(
            "gyroZ",
            getValue(16)
        );


        setValue(
            "eulerX",
            getValue(17)
        );


        setValue(
            "eulerY",
            getValue(18)
        );


        setValue(
            "eulerZ",
            getValue(19)
        );


        setValue(
            "State",
            getValue(20)
        );


        // ----------------------------------------------------
        // CONVERT NUMBERS
        // ----------------------------------------------------

        const altitude =
            Number(values[2]);

        const pressure =
            Number(values[3]);

        const current =
            Number(values[4]);

        const voltage =
            Number(values[5]);

        const accX =
            Number(values[8]);

        const accY =
            Number(values[9]);

        const accZ =
            Number(values[10]);


        // ----------------------------------------------------
        // UPDATE CHARTS
        // ----------------------------------------------------

        addPoint(
            altChart,
            altitude
        );


        addPoint(
            presChart,
            pressure
        );


        addPoint(
            currChart,
            current
        );


        addPoint(
            voltChart,
            voltage
        );


        addAccPoint(
            accX,
            accY,
            accZ
        );


        // ----------------------------------------------------
        // X AXIS COUNTER
        // ----------------------------------------------------

        x++;


    }
    catch (err) {

        console.error(
            "updateData Error:",
            err
        );
    }
}


// ============================================================
// START DASHBOARD UPDATE
// ============================================================

setInterval(
    updateData,
    500
);


// Initial call
updateData();