/**
 * Test Skill 2 - 用于测试 SkillMarket 卸载和更新功能
 */

export default async function TestSkill2() {
  console.log("✅ Test Skill 2 加载成功!");
  
  return {
    name: "test-skill-2",
    version: "1.0.3",
    status: "installed"
  };
}
