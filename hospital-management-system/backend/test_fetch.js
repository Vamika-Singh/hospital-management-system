const http = require('http');

http.get('http://localhost:5000/api/doctors', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    console.log("Response:", JSON.parse(data));
  });
}).on('error', (err) => {
  console.error("Fetch failed:", err.message);
});
