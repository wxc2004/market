/**
 * Test Skill 1 - 用于测试 SkillMarket 安装和 info 功能
 */

export default async function TestSkill1() {
  console.log("✅ Test Skill 1 加载成功!");
  
  return {
    name: "test-skill-1",
    version: "1.0.3",
    status: "installed"
  };
}
