/**
 * Utility script to check if a port is in use and offer to kill the process
 * 
 * Run with: npx ts-node src/scripts/check-port.ts [port]
 */

import { exec } from 'child_process';
import readline from 'readline';

// Get port from command line or use default
const port = process.argv[2] || process.env.PORT || 3000;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check the OS platform to determine command
const isWindows = process.platform === 'win32';
const findCommand = isWindows
  ? `netstat -ano | findstr :${port}`
  : `lsof -i :${port}`;

console.log(`\n=== Checking for processes using port ${port} ===\n`);

exec(findCommand, (error, stdout, stderr) => {
  if (error && !stdout) {
    console.log(`✅ Port ${port} is free. No processes are using it.`);
    rl.close();
    return;
  }

  if (stderr) {
    console.error(`Error checking port: ${stderr}`);
    rl.close();
    return;
  }

  if (stdout) {
    console.log(`Found processes using port ${port}:\n`);
    console.log(stdout);
    
    let killCommand;
    let processPid;
    
    if (isWindows) {
      // Extract PID from Windows netstat output
      const matches = stdout.match(/LISTENING\s+(\d+)/);
      if (matches && matches[1]) {
        processPid = matches[1];
        killCommand = `taskkill /F /PID ${processPid}`;
      }
    } else {
      // Extract PID from lsof output (macOS/Linux)
      const lines = stdout.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 0) {
        // Skip header line in lsof output
        const firstProcessLine = lines[1] || lines[0];
        const parts = firstProcessLine.split(/\s+/);
        // PID is usually the second column in lsof output
        processPid = parts[1];
        killCommand = `kill -9 ${processPid}`;
      }
    }
    
    if (processPid && killCommand) {
      rl.question(`\nDo you want to kill process ${processPid} using port ${port}? (y/n): `, (answer) => {
        if (answer.toLowerCase() === 'y') {
          console.log(`Executing: ${killCommand}`);
          
          exec(killCommand, (killError, killStdout, killStderr) => {
            if (killError) {
              console.error(`Error killing process: ${killError.message}`);
            } else {
              console.log(`✅ Process ${processPid} has been killed. Port ${port} is now free.`);
            }
            rl.close();
          });
        } else {
          console.log('Process kill cancelled. Please free the port manually before starting the server.');
          rl.close();
        }
      });
    } else {
      console.log('\nCould not determine the process ID to kill.');
      console.log('Please free the port manually before starting the server.');
      rl.close();
    }
  }
}); 