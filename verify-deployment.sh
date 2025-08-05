#!/bin/bash

echo "🚀 Mermaid Renderer - 部署验证脚本"
echo "=================================="

echo ""
echo "📋 检查项目状态..."

# 检查Node.js版本
echo "✓ Node.js版本: $(node --version)"

# 检查npm版本
echo "✓ npm版本: $(npm --version)"

# 检查依赖安装
if [ -d "node_modules" ]; then
    echo "✓ 依赖已安装"
else
    echo "❌ 依赖未安装，正在安装..."
    npm install
fi

echo ""
echo "🧪 运行测试..."
npm test -- --run --reporter=verbose

if [ $? -eq 0 ]; then
    echo "✅ 所有测试通过"
else
    echo "❌ 测试失败"
    exit 1
fi

echo ""
echo "🔨 构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

echo ""
echo "📊 构建结果分析..."
if [ -d "dist" ]; then
    echo "✓ dist目录已创建"
    echo "✓ 文件数量: $(find dist -type f | wc -l)"
    echo "✓ 总大小: $(du -sh dist | cut -f1)"
    
    if [ -f "dist/index.html" ]; then
        echo "✓ index.html存在"
    else
        echo "❌ index.html不存在"
        exit 1
    fi
    
    if [ -d "dist/assets" ]; then
        echo "✓ assets目录存在"
        echo "✓ 资源文件数量: $(find dist/assets -type f | wc -l)"
    else
        echo "❌ assets目录不存在"
        exit 1
    fi
else
    echo "❌ dist目录不存在"
    exit 1
fi

echo ""
echo "🔍 Git状态检查..."
git status --porcelain

if [ -z "$(git status --porcelain)" ]; then
    echo "✓ 工作目录干净"
else
    echo "⚠️  有未提交的更改"
fi

echo ""
echo "🌐 GitHub Actions工作流检查..."
if [ -f ".github/workflows/deploy-skip-tests.yml" ]; then
    echo "✓ 部署工作流存在"
else
    echo "❌ 部署工作流不存在"
    exit 1
fi

if [ -f ".github/workflows/ci.yml" ]; then
    echo "✓ CI工作流存在"
else
    echo "❌ CI工作流不存在"
    exit 1
fi

echo ""
echo "📝 文档检查..."
required_files=("README.md" "LICENSE" "DEPLOYMENT.md" "DEPLOYMENT_SUCCESS.md")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo ""
echo "🎉 部署验证完成！"
echo "=================================="
echo ""
echo "✅ 所有检查通过，项目已准备好部署"
echo ""
echo "📋 部署清单："
echo "  ✓ 测试通过"
echo "  ✓ 构建成功"
echo "  ✓ 文件完整"
echo "  ✓ 工作流配置"
echo "  ✓ 文档齐全"
echo ""
echo "🚀 下一步："
echo "  1. 推送代码到GitHub: git push origin main"
echo "  2. 等待GitHub Actions完成部署"
echo "  3. 访问: https://soft98-top.github.io/mermaid/"
echo ""
echo "📊 预期结果："
echo "  - GitHub Actions将自动运行"
echo "  - 应用将部署到GitHub Pages"
echo "  - 所有功能将正常工作"
echo ""
echo "🎯 验证功能："
echo "  - 实时Mermaid渲染"
echo "  - 主题切换"
echo "  - 键盘快捷键"
echo "  - 移动端适配"
echo "  - 导出功能"
echo "  - 嵌套图表"
echo ""
echo "Happy coding! 🎨"