import axios from 'axios';

async function run() {
    try {
        console.log("Fetching asientos...");
        const response = await axios.get("http://localhost:3001/auditoria/asientos", {
            headers: {
                // Not authenticated, but we will see if we get the status:false object correctly
                Cookie: "authToken=DUMMY"
            }
        });
        console.log("Response data:", response.data);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
run();
