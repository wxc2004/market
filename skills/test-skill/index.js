/**
 * Test Skill - SkillMarket 测试技能
 * 
 * 这是一个用于验证 SkillMarket 安装流程的示例 skill
 */

import { tool } from "@opencode-ai/plugin";

export default async function TestSkill() {
  console.log("✅ Test Skill 加载成功!");

  return {
    tool: {
      // 1. 简单的问候工具
      greet: tool({
        description: "向用户打招呼",
        args: {
          name: tool.schema.string().describe("你的名字")
        },
        async execute({ name }, context) {
          const { agent, sessionID } = context;
          return `你好 ${name}！我是 ${agent} 代理，欢迎使用测试插件！会话ID: ${sessionID}`;
        }
      }),

      // 2. 随机数生成工具
      randomNumber: tool({
        description: "生成指定范围的随机数",
        args: {
          min: tool.schema.number().describe("最小值").default(1),
          max: tool.schema.number().describe("最大值").default(100)
        },
        async execute({ min, max }, context) {
          const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
          return `随机数（${min}-${max}）: ${randomNum}`;
        }
      }),

      // 3. 系统信息工具
      systemInfo: tool({
        description: "获取系统信息",
        args: {},
        async execute(args, context) {
          const { sessionID, agent } = context;
          const info = {
            agent: agent,
            sessionID: sessionID,
            timestamp: new Date().toISOString(),
            platform: process.platform,
            nodeVersion: process.version
          };
          return JSON.stringify(info, null, 2);
        }
      })
    },

    // 钩子示例
    "tool.execute.before": async (input, output) => {
      console.log(`🛠️ 工具即将执行: ${input.tool}`);
    },

    "tool.execute.after": async (input, output) => {
      console.log(`✅ 工具执行完成: ${input.tool}`);
    }
  };
}