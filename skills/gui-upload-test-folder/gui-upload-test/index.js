/**
 * GUI 上传功能测试技能
 *
 * 用于验证 SkillMarket GUI Upload 完整流程：
 * - zip 上传与解析
 * - 元数据预览
 * - publish / install / both 操作
 */

export default async function GuiUploadTest() {
  console.log("✅ GUI上传测试技能 加载成功!");

  return {
    name: "gui-upload-test",
    displayName: "GUI上传测试",
    version: "1.0.0",
    description: "用于测试 GUI Upload 功能的 skill",
    status: "installed"
  };
}
