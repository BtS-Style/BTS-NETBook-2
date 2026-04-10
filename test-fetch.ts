async function test() {
  try {
    const endpoints = [
      "http://localhost:3000/api/posts",
      "http://localhost:3000/api/users/admin_master_001"
    ];
    for (const url of endpoints) {
      console.log(`Testing ${url}...`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response: ${text.substring(0, 100)}`);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
