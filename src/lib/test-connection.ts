import { getMcpClient } from "./mcp";
import process from "node:process";

async function test() {
  console.log("🔌 Connecting to Meridian MCP...");
  try {
    const client = await getMcpClient();
    const { tools } = await client.listTools();
    
    console.log(`\n✅ SUCCESS! Found ${tools.length} Meridian Tools:`);
    tools.forEach(t => {
      console.log(` - [${t.name}]: ${t.description?.slice(0, 60)}...`);
    });
  } catch (e) {
    console.error("Fail:", e);
  }
  process.exit(0);
}

test();