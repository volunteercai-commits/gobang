#!/bin/bash

# 五子棋游戏一键发布脚本
# 支持Web应用、桌面应用、Android和iOS应用部署
# 用法: ./deploy.sh [web|desktop|android|ios|mobile]

# 默认部署类型
DEPLOY_TYPE="web"

# 解析命令行参数
if [ $# -gt 0 ]; then
    case $1 in
        "web"|"desktop"|"android"|"ios"|"mobile")
            DEPLOY_TYPE=$1
            ;;
        "-h"|"--help")
            echo "五子棋游戏部署脚本"
            echo ""
            echo "用法: $0 [web|desktop|android|ios|mobile]"
            echo ""
            echo "参数:"
            echo "  web      部署Web应用 (默认)"
            echo "  desktop  构建桌面应用"
            echo "  android  构建Android应用"
            echo "  ios      构建iOS应用 (仅macOS)"
            echo "  mobile   构建所有移动端应用"
            echo "  -h       显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0           # 部署Web应用"
            echo "  $0 web       # 部署Web应用"
            echo "  $0 desktop   # 构建桌面应用"
            echo "  $0 android   # 构建Android应用"
            echo "  $0 ios       # 构建iOS应用"
            echo "  $0 mobile    # 构建所有移动端应用"
            exit 0
            ;;
        *)
            echo "❌ 错误: 未知参数 '$1'"
            echo "使用 '$0 -h' 查看帮助信息"
            exit 1
            ;;
    esac
fi

echo "🚀 五子棋游戏部署脚本启动..."
echo "📦 部署类型: $DEPLOY_TYPE"

# 调试相关函数
debug_ios_simulator() {
    echo "🔍 开始iOS模拟器调试..."
    
    # 检查iOS模拟器
    SIMULATORS=$(xcrun simctl list devices available | grep -E "iPhone|iPad" | wc -l)
    
    if [ "$SIMULATORS" -gt 0 ]; then
        echo "✅ 发现 $SIMULATORS 个可用的iOS模拟器"
        
        # 获取第一个可用的模拟器
        SIMULATOR_INFO=$(xcrun simctl list devices available | grep -E "iPhone|iPad" | head -1)
        SIMULATOR_ID=$(echo "$SIMULATOR_INFO" | grep -o '([A-F0-9-]*)' | tr -d '()')
        SIMULATOR_NAME=$(echo "$SIMULATOR_INFO" | sed 's/.*(\(.*\))/\1/' | sed 's/.*- //' | sed 's/ *$//')
        
        echo "📱 使用模拟器: $SIMULATOR_NAME (ID: $SIMULATOR_ID)"
        
        # 启动模拟器
        echo "🚀 启动模拟器..."
        xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true
        open -a Simulator
        
        echo "⏳ 等待模拟器启动..."
        sleep 5
        
        # 检查应用文件
        BINARY_FILE="target/aarch64-apple-ios/release/gobang-tauri"
        if [ -f "$BINARY_FILE" ]; then
            echo "📦 找到iOS应用二进制文件: $BINARY_FILE"
            
            # 检查是否有Xcode项目
            XCODE_PROJECT="src-tauri/gen/apple/gobang-tauri.xcodeproj"
            if [ -d "$XCODE_PROJECT" ]; then
                echo "📱 找到Xcode项目，尝试命令行安装到模拟器..."
                
                # 使用xcodebuild构建到模拟器
                echo "🔨 构建iOS应用到模拟器..."
                xcodebuild -project "$XCODE_PROJECT" -scheme gobang-tauri_iOS -destination "platform=iOS Simulator,id=$SIMULATOR_ID" -configuration Release build
                
                if [ $? -eq 0 ]; then
                    echo "✅ iOS应用构建成功！"
                    
                    # 安装到模拟器
                    echo "📱 安装到模拟器..."
                    xcrun simctl install "$SIMULATOR_ID" "src-tauri/gen/apple/build/Release-iphonesimulator/gobang-tauri.app"
                    
                    if [ $? -eq 0 ]; then
                        echo "✅ 应用已安装到模拟器！"
                        
                        # 启动应用
                        BUNDLE_ID="com.volunteercai.gobang"
                        xcrun simctl launch "$SIMULATOR_ID" "$BUNDLE_ID"
                        echo "✅ 应用已启动！"
                    else
                        echo "❌ 应用安装到模拟器失败！"
                    fi
                else
                    echo "❌ iOS应用构建失败！"
                fi
            else
                echo "⚠️  未找到Xcode项目，Tauri iOS需要特殊配置"
                echo "📱 请参考Tauri iOS文档进行配置"
            fi
        else
            echo "❌ 未找到iOS应用文件"
        fi
    else
        echo "❌ 未找到可用的iOS模拟器"
        echo "请创建iOS模拟器或连接iOS设备"
    fi
}

debug_android() {
    echo "🔍 开始Android调试..."
    
    # 检查adb是否可用
    if ! command -v adb &> /dev/null; then
        echo "❌ 错误: 未找到 adb 命令，请安装 Android SDK Platform Tools"
        echo "📱 Android调试需要以下环境:"
        echo "   1. 安装Android Studio"
        echo "   2. 设置ANDROID_HOME环境变量"
        echo "   3. 安装Android SDK Platform Tools"
        echo "   4. 运行: npm run mobile:setup"
        return 1
    fi
    
    # 检查连接的设备
    echo "📱 检查连接的Android设备..."
    DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)
    
    if [ "$DEVICES" -gt 0 ]; then
        echo "✅ 发现 $DEVICES 个连接的Android设备"
        DEVICE_ID=$(adb devices | grep -v "List of devices" | grep "device$" | head -1 | awk '{print $1}')
        echo "📱 使用设备: $DEVICE_ID"
        
        # 查找APK文件
        APK_FILE=$(find src-tauri/target/android -name "*.apk" | head -1)
        if [ -n "$APK_FILE" ]; then
            echo "📦 安装APK: $APK_FILE"
            adb -s "$DEVICE_ID" install -r "$APK_FILE"
            if [ $? -eq 0 ]; then
                echo "✅ APK安装成功！"
                # 启动应用
                PACKAGE_NAME="com.volunteercai.gobang"
                echo "🚀 启动应用: $PACKAGE_NAME"
                adb -s "$DEVICE_ID" shell am start -n "$PACKAGE_NAME/.MainActivity"
                echo "✅ 应用已启动！"
            else
                echo "❌ APK安装失败！"
            fi
        else
            echo "❌ 未找到APK文件"
        fi
    else
        echo "⚠️  未发现连接的Android设备，尝试启动模拟器..."
        
        # 检查模拟器
        if command -v emulator &> /dev/null; then
            # 列出可用的AVD
            AVD_LIST=$(emulator -list-avds 2>/dev/null)
            if [ -n "$AVD_LIST" ]; then
                AVD_NAME=$(echo "$AVD_LIST" | head -1)
                echo "📱 启动模拟器: $AVD_NAME"
                emulator -avd "$AVD_NAME" &
                echo "⏳ 等待模拟器启动..."
                sleep 10
                
                # 等待设备连接
                for i in {1..30}; do
                    if adb devices | grep -q "emulator.*device"; then
                        echo "✅ 模拟器已连接"
                        debug_android
                        return
                    fi
                    echo "⏳ 等待模拟器连接... ($i/30)"
                    sleep 2
                done
                echo "❌ 模拟器启动超时"
            else
                echo "❌ 未找到可用的Android模拟器"
                echo "请创建AVD或连接Android设备"
            fi
        else
            echo "❌ 未找到 emulator 命令"
        fi
    fi
}

debug_ios() {
    echo "🔍 开始iOS调试..."
    
    # 检查iOS调试工具
    if ! command -v xcrun &> /dev/null; then
        echo "❌ 错误: 未找到 xcrun 命令，请安装 Xcode"
        return 1
    fi
    
    # 检查连接的iOS设备
    echo "📱 检查连接的iOS设备..."
    DEVICES=$(xcrun xctrace list devices 2>/dev/null | grep -E "iPhone|iPad" | grep -v "Simulator" | wc -l)
    
    if [ "$DEVICES" -gt 0 ]; then
        echo "✅ 发现 $DEVICES 个连接的iOS设备"
        DEVICE_NAME=$(xcrun xctrace list devices 2>/dev/null | grep -E "iPhone|iPad" | grep -v "Simulator" | head -1 | sed 's/.*(\(.*\))/\1/')
        echo "📱 使用设备: $DEVICE_NAME"
        
        # 查找iOS应用文件
        BINARY_FILE="target/aarch64-apple-ios/release/gobang-tauri"
        if [ -f "$BINARY_FILE" ]; then
            echo "📦 找到iOS应用二进制文件: $BINARY_FILE"
            
            # 检查是否有Xcode项目
            XCODE_PROJECT="src-tauri/gen/apple/gobang-tauri.xcodeproj"
            if [ -d "$XCODE_PROJECT" ]; then
                echo "📱 找到Xcode项目，尝试命令行安装..."
                
                # 使用xcodebuild构建和安装
                echo "🔨 构建iOS应用..."
                xcodebuild -project "$XCODE_PROJECT" -scheme gobang-tauri_iOS -destination "generic/platform=iOS" -configuration Release build
                
                if [ $? -eq 0 ]; then
                    echo "✅ iOS应用构建成功！"
                    
                    # 尝试使用ios-deploy安装到设备
                    if command -v ios-deploy &> /dev/null; then
                        echo "📱 安装到连接的iOS设备..."
                        ios-deploy --bundle "src-tauri/gen/apple/build/Release-iphoneos/gobang-tauri.app"
                        
                        if [ $? -eq 0 ]; then
                            echo "✅ 应用已安装到设备！"
                            # 启动应用
                            BUNDLE_ID="com.volunteercai.gobang"
                            ios-deploy --bundle "src-tauri/gen/apple/build/Release-iphoneos/gobang-tauri.app" --justlaunch
                            echo "✅ 应用已启动！"
                        else
                            echo "❌ 应用安装失败，请检查设备连接和证书"
                        fi
                    else
                        echo "⚠️  未找到 ios-deploy，请安装: brew install ios-deploy"
                        echo "📱 或手动安装: 将 $XCODE_PROJECT 拖到Xcode中运行"
                    fi
                else
                    echo "❌ iOS应用构建失败！"
                    echo "💡 提示: 真机调试需要开发者证书签名"
                    echo "📱 自动尝试模拟器调试..."
                    
                    # 自动尝试模拟器调试
                    debug_ios_simulator
                fi
            else
                echo "⚠️  未找到Xcode项目，Tauri iOS需要特殊配置"
                echo "📱 请参考Tauri iOS文档进行配置"
            fi
        else
            echo "❌ 未找到iOS应用文件"
        fi
    else
        echo "⚠️  未发现连接的iOS设备，尝试启动模拟器..."
        
        # 检查iOS模拟器
        SIMULATORS=$(xcrun simctl list devices available | grep -E "iPhone|iPad" | wc -l)
        if [ "$SIMULATORS" -gt 0 ]; then
            SIMULATOR_ID=$(xcrun simctl list devices available | grep -E "iPhone|iPad" | head -1 | grep -o '\[.*\]' | tr -d '[]')
            SIMULATOR_NAME=$(xcrun simctl list devices available | grep -E "iPhone|iPad" | head -1 | awk -F'(' '{print $1}' | xargs)
            echo "📱 启动模拟器: $SIMULATOR_NAME ($SIMULATOR_ID)"
            
            # 启动模拟器
            xcrun simctl boot "$SIMULATOR_ID"
            open -a Simulator
            
            echo "⏳ 等待模拟器启动..."
            sleep 5
            
            # 检查应用文件
            BINARY_FILE="target/aarch64-apple-ios/release/gobang-tauri"
            if [ -f "$BINARY_FILE" ]; then
                echo "📦 找到iOS应用二进制文件: $BINARY_FILE"
                
                # 检查是否有Xcode项目
                XCODE_PROJECT="src-tauri/gen/apple/gobang-tauri.xcodeproj"
                if [ -d "$XCODE_PROJECT" ]; then
                    echo "📱 找到Xcode项目，尝试命令行安装到模拟器..."
                    
                    # 使用xcodebuild构建到模拟器
                    echo "🔨 构建iOS应用到模拟器..."
                    xcodebuild -project "$XCODE_PROJECT" -scheme gobang-tauri_iOS -destination "platform=iOS Simulator,name=$SIMULATOR_NAME" -configuration Release build
                    
                    if [ $? -eq 0 ]; then
                        echo "✅ iOS应用构建成功！"
                        
                        # 安装到模拟器
                        echo "📱 安装到模拟器..."
                        xcrun simctl install "$SIMULATOR_ID" "src-tauri/gen/apple/build/Release-iphonesimulator/gobang-tauri.app"
                        
                        if [ $? -eq 0 ]; then
                            echo "✅ 应用已安装到模拟器！"
                            
                            # 启动应用
                            BUNDLE_ID="com.volunteercai.gobang"
                            xcrun simctl launch "$SIMULATOR_ID" "$BUNDLE_ID"
                            echo "✅ 应用已启动！"
                        else
                            echo "❌ 应用安装到模拟器失败！"
                        fi
                    else
                        echo "❌ iOS应用构建失败！"
                    fi
                else
                    echo "⚠️  未找到Xcode项目，Tauri iOS需要特殊配置"
                    echo "📱 请参考Tauri iOS文档进行配置"
                fi
            else
                echo "❌ 未找到iOS应用文件"
            fi
        else
            echo "❌ 未找到可用的iOS模拟器"
            echo "请创建iOS模拟器或连接iOS设备"
        fi
    fi
}

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本！"
    exit 1
fi

# 检查必要的工具
if [ "$DEPLOY_TYPE" = "web" ]; then
    if ! command -v scp &> /dev/null; then
        echo "❌ 错误: 未找到 scp 命令，请安装 OpenSSH"
        exit 1
    fi
    if ! command -v ssh &> /dev/null; then
        echo "❌ 错误: 未找到 ssh 命令，请安装 OpenSSH"
        exit 1
    fi
elif [ "$DEPLOY_TYPE" = "android" ] || [ "$DEPLOY_TYPE" = "mobile" ]; then
    if ! command -v tauri &> /dev/null && ! npx tauri --version &> /dev/null; then
        echo "❌ 错误: 未找到 tauri 命令，请安装 Tauri CLI"
        echo "安装命令: npm install -g @tauri-apps/cli@latest"
        echo "或使用: npx @tauri-apps/cli"
        exit 1
    fi
    
    # 检查Android环境
    ANDROID_ENV_OK=true
    
    if [ -z "$ANDROID_HOME" ]; then
        echo "❌ 错误: ANDROID_HOME 环境变量未设置"
        ANDROID_ENV_OK=false
    fi
    
    if ! command -v adb &> /dev/null; then
        echo "❌ 错误: 未找到 adb 命令，请安装 Android SDK Platform Tools"
        ANDROID_ENV_OK=false
    fi
    
    if ! command -v emulator &> /dev/null; then
        echo "❌ 错误: 未找到 emulator 命令，请安装 Android SDK Tools"
        ANDROID_ENV_OK=false
    fi
    
    if [ "$ANDROID_ENV_OK" = false ]; then
        echo ""
        echo "🔧 Android环境修复指南:"
        echo "   1. 安装Android Studio"
        echo "   2. 设置环境变量:"
        echo "      export ANDROID_HOME=\$HOME/Library/Android/sdk"
        echo "      export PATH=\$PATH:\$ANDROID_HOME/emulator"
        echo "      export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
        echo "   3. 添加到 ~/.zshrc 或 ~/.bashrc"
        echo "   4. 运行环境检查: ./check-mobile-env.sh"
        echo ""
        echo "💡 或者先测试iOS: ./deploy.sh ios"
        exit 1
    fi
elif [ "$DEPLOY_TYPE" = "ios" ] || [ "$DEPLOY_TYPE" = "mobile" ]; then
    if ! command -v tauri &> /dev/null && ! npx tauri --version &> /dev/null; then
        echo "❌ 错误: 未找到 tauri 命令，请安装 Tauri CLI"
        echo "安装命令: npm install -g @tauri-apps/cli@latest"
        echo "或使用: npx @tauri-apps/cli"
        exit 1
    fi
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo "❌ 错误: iOS构建需要macOS系统"
        exit 1
    fi
    if ! command -v xcodebuild &> /dev/null; then
        echo "❌ 错误: 未找到 Xcode，请安装 Xcode"
        exit 1
    fi
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
if [ "$DEPLOY_TYPE" = "web" ]; then
    rm -rf build/
elif [ "$DEPLOY_TYPE" = "desktop" ]; then
    rm -rf src-tauri/target/release/
elif [ "$DEPLOY_TYPE" = "android" ] || [ "$DEPLOY_TYPE" = "mobile" ]; then
    rm -rf src-tauri/target/android/
elif [ "$DEPLOY_TYPE" = "ios" ] || [ "$DEPLOY_TYPE" = "mobile" ]; then
    rm -rf src-tauri/target/aarch64-apple-ios/
fi

# 构建项目
echo "🔨 构建项目..."
if [ "$DEPLOY_TYPE" = "web" ]; then
    echo "  📱 构建Web应用..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ Web应用构建失败！"
        exit 1
    fi
    
    echo "✅ Web应用构建成功！"
    
    # 检查构建产物
    if [ ! -f "build/index.html" ]; then
        echo "❌ 错误: 未找到 build/index.html"
        exit 1
    fi
    
    # 上传到服务器
    echo "📤 上传Web应用到服务器..."
    scp -r build/* caixy.icu:/var/www/html/
    
    if [ $? -eq 0 ]; then
        echo "✅ Web应用上传成功！"
    else
        echo "❌ Web应用上传失败！"
        exit 1
    fi
    
    # 验证部署
    echo "🔍 验证Web应用部署..."
    ssh caixy.icu "ls -la /var/www/html/index.html"
    
    if [ $? -eq 0 ]; then
        echo "✅ Web应用部署验证成功！"
    else
        echo "❌ Web应用部署验证失败！"
        exit 1
    fi
    
    echo ""
    echo "🎉 Web应用部署完成！"
    echo "🌐 访问地址: http://8.219.153.61/"
    echo "🎮 开始游戏吧！"
    
elif [ "$DEPLOY_TYPE" = "desktop" ]; then
    echo "  🖥️  构建桌面应用..."
    npm run tauri:build
    
    if [ $? -ne 0 ]; then
        echo "❌ 桌面应用构建失败！"
        exit 1
    fi
    
    echo "✅ 桌面应用构建成功！"
    
    # 检查构建产物
    if [ ! -d "target/release/bundle/macos" ] && [ ! -d "target/release/bundle/dmg" ]; then
        echo "❌ 错误: 未找到桌面应用构建产物"
        echo "请检查 target/release/bundle/ 目录"
        exit 1
    fi
    
    echo ""
    echo "🎉 桌面应用构建完成！"
    echo "📁 应用位置: target/release/bundle/"
    echo "🖥️  可以运行应用了！"
    
    # 显示构建产物信息
    echo ""
    echo "📦 构建产物:"
    ls -la target/release/bundle/
    
elif [ "$DEPLOY_TYPE" = "android" ]; then
    echo "  🤖 构建Android应用..."
    npm run tauri:build:android-release
    
    if [ $? -ne 0 ]; then
        echo "❌ Android应用构建失败！"
        exit 1
    fi
    
    echo "✅ Android应用构建成功！"
    
    # 检查构建产物
    if [ ! -d "src-tauri/target/android" ]; then
        echo "❌ 错误: 未找到Android应用构建产物"
        echo "请检查 src-tauri/target/android/ 目录"
        exit 1
    fi
    
    echo ""
    echo "🎉 Android应用构建完成！"
    echo "📁 应用位置: src-tauri/target/android/"
    echo "📱 可以安装到Android设备了！"
    
    # 显示构建产物信息
    echo ""
    echo "📦 构建产物:"
    find src-tauri/target/android -name "*.apk" -o -name "*.aab" | head -10
    
    # 自动调试
    echo ""
    echo "🔍 开始自动调试..."
    debug_android
    
elif [ "$DEPLOY_TYPE" = "ios" ]; then
    echo "  🍎 构建iOS应用..."
    npm run tauri:build:ios
    
    if [ $? -ne 0 ]; then
        echo "❌ iOS应用构建失败！"
        exit 1
    fi
    
    echo "✅ iOS应用构建成功！"
    
    # 检查构建产物
    if [ ! -f "target/aarch64-apple-ios/release/gobang-tauri" ]; then
        echo "❌ 错误: 未找到iOS应用构建产物"
        echo "请检查 target/aarch64-apple-ios/release/ 目录"
        exit 1
    fi
    
    echo ""
    echo "🎉 iOS应用构建完成！"
    echo "📁 应用位置: target/aarch64-apple-ios/release/"
    echo "📱 可以安装到iOS设备了！"
    
    # 显示构建产物信息
    echo ""
    echo "📦 构建产物:"
    ls -la target/aarch64-apple-ios/release/
    
    # 自动调试
    echo ""
    echo "🔍 开始自动调试..."
    debug_ios
    
elif [ "$DEPLOY_TYPE" = "mobile" ]; then
    echo "  📱 构建所有移动端应用..."
    
    # 构建Android
    echo "  🤖 构建Android应用..."
    npm run tauri:build:android-release
    
    if [ $? -ne 0 ]; then
        echo "❌ Android应用构建失败！"
        exit 1
    fi
    
    echo "✅ Android应用构建成功！"
    
    # 构建iOS (仅在macOS上)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  🍎 构建iOS应用..."
        npm run tauri:build:ios
        
        if [ $? -ne 0 ]; then
            echo "❌ iOS应用构建失败！"
            exit 1
        fi
        
        echo "✅ iOS应用构建成功！"
    else
        echo "⚠️  跳过iOS构建 (需要macOS系统)"
    fi
    
    echo ""
    echo "🎉 所有移动端应用构建完成！"
    echo "📁 Android应用位置: src-tauri/target/android/"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "📁 iOS应用位置: src-tauri/target/aarch64-apple-ios/release/"
    fi
    echo "📱 可以安装到移动设备了！"
    
    # 显示构建产物信息
    echo ""
    echo "📦 构建产物:"
    echo "Android:"
    find src-tauri/target/android -name "*.apk" -o -name "*.aab" | head -5
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "iOS:"
        ls -la src-tauri/target/aarch64-apple-ios/release/ | head -5
    fi
    
    # 自动调试
    echo ""
    echo "🔍 开始自动调试..."
    echo "🤖 调试Android应用..."
    debug_android
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo ""
        echo "🍎 调试iOS应用..."
        debug_ios
    fi
fi

echo ""
echo "✨ 部署脚本执行完成！"