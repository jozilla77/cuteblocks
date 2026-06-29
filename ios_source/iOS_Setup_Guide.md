# Orbit Bubble Puzzle - iOS Setup Guide

This guide explains how to take the web source files and compile them into a native iOS app using a Mac and Xcode.

## Prerequisites
1. A Mac computer (or a cloud Mac service like MacinCloud).
2. [Xcode](https://developer.apple.com/xcode/) installed from the Mac App Store.
3. An Apple Developer Account (free account allows testing on your own device; paid account is required for the App Store).

## Step 1: Create a New Xcode Project
1. Open **Xcode** and select **Create a new Xcode project**.
2. Select **iOS** at the top, then choose **App** and click **Next**.
3. Fill in the project details:
   - **Product Name**: `OrbitBubblePuzzle`
   - **Team**: Select your Apple Developer account if signed in, or leave as `None` for now.
   - **Organization Identifier**: `com.jozilla`
   - **Interface**: `Storyboard`
   - **Language**: `Swift`
4. Click **Next** and save the project to your computer.

## Step 2: Add Game Assets to the Project
1. Open Finder and locate your web source files (you'll need to transfer them to the Mac first). You need the following files and folders:
   - `game.html`
   - `style.css`
   - `manifest.json`
   - `manifest.webmanifest`
   - `src/` (folder)
   - `icons/` (folder)
2. Drag and drop all these files/folders directly into Xcode, placing them into the `OrbitBubblePuzzle` folder in the left-hand navigation pane (the Project Navigator).
3. A popup will appear. **CRITICAL STEP**: Make sure to check **"Create folder references"** (do NOT choose "Create groups"). Also check "Add to targets: OrbitBubblePuzzle".
4. Click **Finish**. Your folders in Xcode should appear **blue**, not yellow.

## Step 3: Implement the WebView
1. In the left-hand Project Navigator, find and click on `ViewController.swift`.
2. Replace all the code inside that file with the code provided in `ViewController.swift` from this `ios_source` folder.

## Step 4: Configure App Settings
1. Click on the top-level `OrbitBubblePuzzle` project file in the Project Navigator (it has a blue app icon next to it).
2. Go to the **General** tab in the main window area.
3. Under **Deployment Info**:
   - Check both **Portrait** and **Landscape** orientations if you want the app to support both. For standard block puzzle games, it's recommended to only check **Portrait**.
   - Select **Hide status bar** (if the option is available depending on Xcode version).
4. Under **App Icons and Launch Images**:
   - You can drag your 1024x1024 icon into the `Assets.xcassets` catalog for the App Icon.

## Step 5: Build and Run!
1. At the top of the Xcode window, select a simulator (e.g., "iPhone 15 Pro") from the device dropdown menu.
2. Click the large **Play (▶)** button in the top left corner to build and run the app.
3. The iOS Simulator will open, and you should see Orbit Bubble Puzzle running perfectly!

## Running on a Physical Device
To run on your actual iPhone:
1. Connect your iPhone to your Mac via USB.
2. Select your iPhone from the device dropdown menu at the top of Xcode.
3. Ensure you have selected a Team in the "Signing & Capabilities" tab of your project settings.
4. Click Play! (You may need to go to Settings > General > VPN & Device Management on your iPhone to "trust" your developer certificate before the app will open).
