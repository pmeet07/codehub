
async function test() {
    try {
        const response = await fetch('http://localhost:5000/api/ai/explain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: "console.log('hello world')",
                language: "English"
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();
