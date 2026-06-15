/**
 * 上传演示技能 - Demo Upload Test
 *
 * 用于演示 SkillMarket GUI Upload 的完整流程：
 * 1. 将 skill 目录打包为 zip
 * 2. 在 GUI Upload 页面上传
 * 3. 预览解析后的元数据
 * 4. 发布到 npm / 安装到本地
 *
 * 安装后执行此文件即可验证技能是否正常工作。
 */

export default async function DemoUploadTest() {
  console.log("🎉 上传演示技能加载成功! (Demo Upload Test)");

  return {
    name: "demo-upload-test",
    displayName: "上传演示技能",
    version: "1.0.0",
    description: "演示 SkillMarket GUI 上传功能的完整流程",
    status: "installed"
  };
}
