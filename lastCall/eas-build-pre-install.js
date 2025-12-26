const { execSync, exec } = require('child_process');

console.log("Forcing ownership and permissions before npm");

execSync("sudo chown -R expo:staff /Users/expo/workingdir/build", { stdio: "inherit" });

execSync("sudo chmod -R 777 /Users/expo/workingdir/build", { stdio: "inherit" });

console.log("Permissions adjusted");

execSync("rm -rf node_modules", { stdio: "inherit" });

execSync("npm install --legacy-peer-deps --unsafe-perm=true", { stdio: 'inherit' });

console.log("Dependencies installed");