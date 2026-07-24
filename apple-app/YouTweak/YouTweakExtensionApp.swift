import Foundation
import SwiftUI
import SafariServices

#if os(macOS)
import AppKit
#elseif os(iOS)
import UIKit
#endif

private let safariExtensionIdentifier = "com.yttweak.appleapp.Extension"
private let appVersion = bundleBuildInfoValue("CFBundleShortVersionString", fallback: "unknown")
private let buildNumber = bundleBuildInfoValue("CFBundleVersion", fallback: "unknown")
private let githubRepositoryURL = URL(string: "https://github.com/xlch88/YouTubeTweak")!
private let appBuildDate = bundleBuildInfoValue("YTTweakBuildDate", fallback: "unknown")
private let appCommitID = bundleBuildInfoValue("YTTweakCommitID", fallback: "unknown")
private let appCommitURL = URL(
    string: bundleBuildInfoValue("YTTweakCommitURL", fallback: githubRepositoryURL.absoluteString)
) ?? githubRepositoryURL

#if os(macOS)
private func openInSafari(_ url: URL, label: String) {
    AppDebugLog.write("Opening \(label) in Safari: \(url.absoluteString)")
    NSWorkspace.shared.open(
        [url],
        withApplicationAt: URL(fileURLWithPath: "/Applications/Safari.app"),
        configuration: NSWorkspace.OpenConfiguration()
    ) { _, error in
        if let error {
            NSLog("Failed to open %@ in Safari: %@", label, error.localizedDescription)
        } else {
            AppDebugLog.write("Opening \(label) in Safari completed.")
        }
    }
}
#endif

private func bundleBuildInfoValue(_ key: String, fallback: String) -> String {
    guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String else {
        return fallback
    }

    let trimmedValue = value.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmedValue.isEmpty || trimmedValue.contains("$(") {
        return fallback
    }

    return trimmedValue
}

private enum AppDebugLog {
    static func write(_ message: String) {
        let line = "[YouTweak] \(message)"
        if let data = "\(line)\n".data(using: .utf8) {
            FileHandle.standardError.write(data)
        }
    }
}

private enum L10n {
    private static let supportedLanguages = [
        "ar-SA",
        "bn-BD",
        "de-DE",
        "en-US",
        "es-ES",
        "fa-IR",
        "fr-FR",
        "hi-IN",
        "id-ID",
        "it-IT",
        "ja-JP",
        "ko-KR",
        "mr-IN",
        "ms-MY",
        "pa-PK",
        "pt-BR",
        "ru-RU",
        "ta-IN",
        "te-IN",
        "th-TH",
        "tr-TR",
        "uk-UA",
        "vi-VN",
        "zh-CN",
        "zh-TW",
    ]

    static let defaultLanguageCode = preferredLanguageCode()
    static let languageOptions = supportedLanguages.map { (code: $0, title: $0) }

    private static let fallbackLanguage = "zh-CN"
    private static let bundledStrings = Dictionary(
        uniqueKeysWithValues: supportedLanguages.compactMap { language -> (String, [String: String])? in
            guard let strings = loadStrings(for: language) else { return nil }
            return (language, strings)
        }
    )
    private static let fallbackStrings = bundledStrings[fallbackLanguage] ?? [:]

    static func t(_ key: String, language: String? = nil) -> String {
        let language = language ?? defaultLanguageCode
        return bundledStrings[language]?[key] ?? fallbackStrings[key] ?? key
    }

    static func format(_ key: String, language: String? = nil, _ arguments: CVarArg...) -> String {
        String(format: t(key, language: language), arguments: arguments)
    }

    private static func loadStrings(for language: String) -> [String: String]? {
        guard let url = Bundle.main.url(
            forResource: language,
            withExtension: "json",
            subdirectory: "assets/i18n"
        ) else {
            return nil
        }

        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([String: String].self, from: data)
        } catch {
            NSLog("Failed to load app localization %@: %@", language, error.localizedDescription)
            return nil
        }
    }

    private static func preferredLanguageCode() -> String {
        for rawLanguage in Locale.preferredLanguages {
            let normalized = rawLanguage.replacingOccurrences(of: "_", with: "-")

            if supportedLanguages.contains(normalized) {
                return normalized
            }

            if normalized.hasPrefix("zh-Hant") || normalized.hasPrefix("zh-TW") || normalized.hasPrefix("zh-HK") {
                return "zh-TW"
            }

            if normalized.hasPrefix("zh-Hans") || normalized.hasPrefix("zh-CN") {
                return "zh-CN"
            }

            let languageCode = normalized.split(separator: "-").first.map(String.init) ?? normalized
            if languageCode == "zh" {
                return "zh-CN"
            }

            if languageCode == "pt" {
                return "pt-BR"
            }

            if let matchedLanguage = supportedLanguages.first(where: { $0.hasPrefix("\(languageCode)-") }) {
                return matchedLanguage
            }
        }

        return fallbackLanguage
    }
}

@main
struct YouTweakExtensionApp: App {
    #if os(macOS)
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    #endif

    var body: some Scene {
        WindowGroup {
            YouTweakHomeView()
        }
    }
}

#if os(macOS)
private final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        if let image = bundleIconImage {
            NSApplication.shared.applicationIconImage = image
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    private var bundleIconImage: NSImage? {
        let iconNames = ["CFBundleIconFile", "CFBundleIconName"]
            .compactMap { Bundle.main.object(forInfoDictionaryKey: $0) as? String }

        for iconName in iconNames {
            let resourceName = iconName.hasSuffix(".icns")
                ? String(iconName.dropLast(5))
                : iconName

            if let iconURL = Bundle.main.url(forResource: resourceName, withExtension: "icns"),
               let image = NSImage(contentsOf: iconURL) {
                return image
            }
        }

        return NSImage(named: NSImage.applicationIconName)
    }
}
#endif

private struct YouTweakHomeView: View {
    @State private var statusText: String?
    @State private var isOpeningSafari = false
    #if DEBUG
    @State private var selectedLanguageCode = L10n.defaultLanguageCode
    #endif

    var body: some View {
        content
            .onAppear {
                #if os(iOS)
                AppDebugLog.write("iOS home view appeared.")
                #endif
            }
            #if DEBUG
            .overlay(alignment: .topTrailing) {
                DebugLanguagePicker(selectedLanguageCode: $selectedLanguageCode)
                    .padding(12)
            }
            #endif
    }

    @ViewBuilder
    private var content: some View {
        #if os(macOS)
        MacInstallView(
            statusText: statusText,
            isOpeningSafari: isOpeningSafari,
            languageCode: activeLanguageCode,
            openSafariExtensionSettings: openSafariExtensionSettings
        )
        #else
        IOSInstallView(
            languageCode: activeLanguageCode
        )
        #endif
    }

    private var activeLanguageCode: String? {
        #if DEBUG
        selectedLanguageCode
        #else
        nil
        #endif
    }

    private func openSafariExtensionSettings() {
        if isOpeningSafari {
            AppDebugLog.write("Ignored enable extension tap because a settings open request is already running.")
            return
        }

        isOpeningSafari = true
        statusText = nil

        #if os(macOS)
        SFSafariApplication.showPreferencesForExtension(withIdentifier: safariExtensionIdentifier) { error in
            DispatchQueue.main.async {
                isOpeningSafari = false

                if let error {
                    NSLog("Failed to open Safari extension preferences: %@", error.localizedDescription)
                    statusText = L10n.format(
                        "status.openSafariPreferencesFailed",
                        language: activeLanguageCode,
                        error.localizedDescription
                    )
                } else {
                    NSApplication.shared.terminate(nil)
                }
            }
        }
        #else
        AppDebugLog.write("iOS enable extension button tapped.")
        let settingsURLs = [
            "App-prefs:SAFARI&path=WEB_EXTENSIONS",
            "prefs:root=SAFARI&path=WEB_EXTENSIONS",
            UIApplication.openSettingsURLString,
        ]
        openFirstAvailableURL(settingsURLs, index: 0, label: "iOS Safari extension settings") { _ in
            isOpeningSafari = false
            statusText = L10n.t("status.openIOSSettings", language: activeLanguageCode)
        }
        #endif
    }

    #if os(iOS)
    private func openFirstAvailableURL(
        _ urlStrings: [String],
        index: Int,
        label: String,
        completion: @escaping (Bool) -> Void
    ) {
        guard index < urlStrings.count else {
            AppDebugLog.write("Opening \(label) failed for all candidate URLs.")
            completion(false)
            return
        }

        guard let url = URL(string: urlStrings[index]) else {
            AppDebugLog.write("Skipping invalid \(label) URL: \(urlStrings[index])")
            openFirstAvailableURL(urlStrings, index: index + 1, label: label, completion: completion)
            return
        }

        AppDebugLog.write("Opening \(label) URL: \(url.absoluteString)")
        UIApplication.shared.open(url, options: [:]) { success in
            DispatchQueue.main.async {
                AppDebugLog.write("Opening \(label) URL completed: \(success ? "success" : "failed")")
                if success {
                    completion(true)
                } else {
                    openFirstAvailableURL(urlStrings, index: index + 1, label: label, completion: completion)
                }
            }
        }
    }
    #endif
}

#if DEBUG
private struct DebugLanguagePicker: View {
    @Binding var selectedLanguageCode: String

    var body: some View {
        Picker("Language", selection: $selectedLanguageCode) {
            ForEach(L10n.languageOptions, id: \.code) { language in
                Text(language.title)
                    .tag(language.code)
            }
        }
        .labelsHidden()
        .pickerStyle(.menu)
        .controlSize(.small)
        .frame(width: 104)
        .background(
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(Color.white.opacity(0.92))
        )
        .accessibilityLabel("Language")
    }
}
#endif

#if os(macOS)
private struct MacInstallView: View {
    let statusText: String?
    let isOpeningSafari: Bool
    let languageCode: String?
    let openSafariExtensionSettings: () -> Void

    var body: some View {
        HStack(spacing: 38) {
            ExtensionIconView(size: 132, cornerRadius: 24)

            VStack(alignment: .leading, spacing: 18) {
                Text("YouTweak")
                    .font(.system(size: 30, weight: .semibold))

                VStack(alignment: .leading, spacing: 8) {
                    Text(L10n.t("mac.instruction.enable", language: languageCode))
                    Text(L10n.t("mac.instruction.authorize", language: languageCode))
                    Text(L10n.t("mac.instruction.help", language: languageCode))
                }
                .font(.system(size: 15))
                .foregroundStyle(Color(red: 0.42, green: 0.42, blue: 0.42))
                .lineSpacing(4)
                .lineLimit(nil)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)

                Button(L10n.t("button.enableExtension", language: languageCode)) {
                    openSafariExtensionSettings()
                }
                .buttonStyle(InstallButtonStyle())
                .disabled(isOpeningSafari)
                .frame(width: 320)
                .padding(.top, 4)

                UnderlinedTextButton(L10n.t("button.openExtensionSettings", language: languageCode)) {
                    openSafariExtensionSettings()
                }
                .disabled(isOpeningSafari)

                if let statusText {
                    Text(statusText)
                        .font(.system(size: 12))
                        .foregroundStyle(.red)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 0)

                FooterLinksView(languageCode: languageCode)

                BuildInfoFooterView()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 52)
        .padding(.vertical, 42)
        .frame(width: 760, height: 420)
        .background(Color.white)
        .background(WindowConfigurator())
    }
}
#endif

#if os(iOS)
private struct IOSInstallView: View {
    let languageCode: String?

    var body: some View {
        GeometryReader { geometry in
            let availableWidth = geometry.size.width - geometry.safeAreaInsets.leading - geometry.safeAreaInsets.trailing
            let availableHeight = geometry.size.height - geometry.safeAreaInsets.top - geometry.safeAreaInsets.bottom
            let isWideLayout = availableWidth >= 680
            let edgePadding = min(max(availableWidth * 0.045, 24), 52)
            let verticalPadding = min(max(availableHeight * 0.06, 28), 56)
            let iconSize = min(max(min(availableWidth, availableHeight) * 0.18, 128), 160)
            let wideTextWidth = min(max(availableWidth * 0.25, 360), 430)
            let wideColumnSpacing = min(max(availableWidth * 0.028, 28), 42)

            ZStack {
                Color.white
                    .ignoresSafeArea()

                if isWideLayout {
                    HStack(alignment: .center, spacing: wideColumnSpacing) {
                        ExtensionIconView(size: iconSize, cornerRadius: 24)

                        installContent
                            .frame(width: wideTextWidth, alignment: .leading)
                    }
                    .fixedSize(horizontal: true, vertical: true)
                    .position(
                        x: geometry.size.width / 2,
                        y: geometry.size.height / 2
                    )
                } else {
                    ScrollView(.vertical, showsIndicators: false) {
                        Group {
                            VStack(alignment: .leading, spacing: 28) {
                                ExtensionIconView(size: iconSize, cornerRadius: 24)
                                    .frame(maxWidth: .infinity, alignment: .leading)

                                installContent
                            }
                        }
                        .padding(.horizontal, edgePadding)
                        .padding(.vertical, verticalPadding)
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: availableHeight, alignment: .center)
                    }
                    .scrollBounceBehavior(.basedOnSize)
                }
            }
        }
    }

    private var installContent: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("YouTweak")
                .font(.system(size: 30, weight: .semibold))

            VStack(alignment: .leading, spacing: 8) {
                instructionText("ios.instruction.enable")
                instructionText("ios.instruction.authorize")
                instructionText("ios.instruction.help")
            }
            .font(.system(size: 15))
            .foregroundStyle(Color(red: 0.42, green: 0.42, blue: 0.42))
            .lineSpacing(4)
            .multilineTextAlignment(.leading)

            Button(L10n.t("button.enableExtension", language: languageCode)) {
                openIOSHelp(anchor: "safari-enable")
            }
            .buttonStyle(InstallButtonStyle())
            .frame(maxWidth: .infinity)
            .padding(.top, 4)

            UnderlinedTextButton(L10n.t("button.openExtensionSettings", language: languageCode)) {
                openIOSHelp(anchor: "safari-setting")
            }

            FooterLinksView(languageCode: languageCode)
                .padding(.top, 16)

            BuildInfoFooterView()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func instructionText(_ key: String) -> some View {
        Text(L10n.t(key, language: languageCode))
            .lineLimit(nil)
            .fixedSize(horizontal: false, vertical: true)
            .multilineTextAlignment(.leading)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func openIOSHelp(anchor: String) {
        let normalizedLanguageCode = languageCode ?? L10n.defaultLanguageCode
        let docsPath: String

        if normalizedLanguageCode.hasPrefix("zh") {
            docsPath = "docs/zh-cn/help/ios.md"
        } else if normalizedLanguageCode.hasPrefix("ja") {
            docsPath = "docs/ja/help/ios.md"
        } else {
            docsPath = "docs/en/help/ios.md"
        }

        if let url = URL(string: "https://github.com/xlch88/YouTubeTweak/blob/main/\(docsPath)#\(anchor)") {
            AppDebugLog.write("iOS help link tapped: \(url.absoluteString)")
            UIApplication.shared.open(url, options: [:]) { success in
                AppDebugLog.write("Opening iOS help link completed: \(success ? "success" : "failed")")
            }
        }
    }
}
#endif

private struct ExtensionIconView: View {
    let size: CGFloat
    let cornerRadius: CGFloat

    var body: some View {
        Group {
            #if os(macOS)
            if let image = extensionIconImage {
                Image(nsImage: image)
                    .resizable()
                    .interpolation(.high)
                    .scaledToFit()
            } else {
                fallbackIcon
            }
            #else
            if let image = extensionIconImage {
                Image(uiImage: image)
                    .resizable()
                    .interpolation(.high)
                    .scaledToFit()
            } else {
                fallbackIcon
            }
            #endif
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }

    private var fallbackIcon: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(Color(red: 0.91, green: 0.29, blue: 0.55))
    }

    #if os(macOS)
    private var extensionIconImage: NSImage? {
        ExtensionIconSource.nsImage
    }
    #else
    private var extensionIconImage: UIImage? {
        ExtensionIconSource.uiImage
    }
    #endif
}

private enum ExtensionIconSource {
    #if os(macOS)
    static var nsImage: NSImage? {
        for iconURL in iconURLs {
            if let image = NSImage(contentsOf: iconURL) {
                return image
            }
        }

        return NSImage(named: NSImage.applicationIconName)
    }
    #elseif os(iOS)
    static var uiImage: UIImage? {
        for iconURL in iconURLs {
            if let image = UIImage(contentsOfFile: iconURL.path) {
                return image
            }
        }

        return nil
    }
    #endif

    private static var iconURLs: [URL] {
        [
            bundledExtensionIconURL,
            outputIconURL,
        ].compactMap { $0 }
    }

    private static var outputIconURL: URL? {
        guard let iconsDirectory = outputIconsDirectory else { return nil }
        return preferredIconURL(in: iconsDirectory)
    }

    private static var outputIconsDirectory: URL? {
        let outputName: String
        #if DEBUG
        outputName = "safari-mv2-dev"
        #else
        outputName = "safari-mv2"
        #endif

        for projectRoot in localProjectRootCandidates {
            let iconsDirectory = projectRoot
                .appendingPathComponent(".output", isDirectory: true)
                .appendingPathComponent(outputName, isDirectory: true)
                .appendingPathComponent("icons", isDirectory: true)

            if FileManager.default.fileExists(atPath: iconsDirectory.path) {
                return iconsDirectory
            }
        }

        return nil
    }

    private static var bundledExtensionIconURL: URL? {
        guard let plugInsURL = Bundle.main.builtInPlugInsURL else { return nil }
        let extensionURL = plugInsURL.appendingPathComponent("YouTweakExtension.appex")
        guard let iconsDirectory = Bundle(url: extensionURL)?
            .resourceURL?
            .appendingPathComponent("icons", isDirectory: true)
        else {
            return nil
        }

        return preferredIconURL(in: iconsDirectory)
    }

    private static var localProjectRootCandidates: [URL] {
        var roots: [URL] = []
        let startURLs = [
            URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true),
            Bundle.main.executableURL,
            Bundle.main.bundleURL,
            Bundle.main.resourceURL,
        ].compactMap { $0 }

        for startURL in startURLs {
            var currentURL = startURL

            for _ in 0..<12 {
                if currentURL.lastPathComponent == "apple-app" {
                    roots.append(currentURL.deletingLastPathComponent())
                    break
                }

                let parentURL = currentURL.deletingLastPathComponent()
                if parentURL.path == currentURL.path {
                    break
                }
                currentURL = parentURL
            }
        }

        return roots.reduce(into: []) { uniqueRoots, root in
            if !uniqueRoots.contains(where: { $0.standardizedFileURL == root.standardizedFileURL }) {
                uniqueRoots.append(root)
            }
        }
    }

    private static func preferredIconURL(in iconsDirectory: URL) -> URL? {
        for iconSize in ["1024", "512", "256", "128", "64", "48", "32", "16"] {
            let url = iconsDirectory.appendingPathComponent("\(iconSize).png")
            if FileManager.default.fileExists(atPath: url.path) {
                return url
            }
        }

        return nil
    }
}

#if os(macOS)
private struct WindowConfigurator: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        DispatchQueue.main.async {
            configure(window: view.window)
        }
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        DispatchQueue.main.async {
            configure(window: nsView.window)
        }
    }

    private func configure(window: NSWindow?) {
        guard let window else { return }

        let contentSize = NSSize(width: 760, height: 420)
        window.title = "YouTweak"
        window.contentMinSize = contentSize
        window.contentMaxSize = contentSize
        window.setContentSize(contentSize)
        window.center()
    }
}
#endif

private struct InstallButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(Color(red: 0.12, green: 0.12, blue: 0.12))
            .frame(maxWidth: .infinity, minHeight: 36)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(Color(red: 0.98, green: 0.985, blue: 0.99))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .stroke(Color(red: 0.86, green: 0.86, blue: 0.86), lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.72 : 1)
    }
}

private struct UnderlinedTextButton: View {
    let title: String
    let action: () -> Void

    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .underline()
                .foregroundStyle(Color(red: 0.38, green: 0.38, blue: 0.38))
        }
        .buttonStyle(.plain)
    }
}

private struct FooterLinksView: View {
    let languageCode: String?

    private var separatorColor: Color {
        #if os(iOS)
        Color(red: 0.52, green: 0.52, blue: 0.52)
        #else
        Color(red: 0.72, green: 0.72, blue: 0.72)
        #endif
    }

    var body: some View {
        HStack(spacing: 9) {
            FooterLink(L10n.t("footer.github", language: languageCode), url: "https://github.com/xlch88/YouTubeTweak")
            Circle()
                .fill(separatorColor)
                .frame(width: 3.5, height: 3.5)
            FooterLink(L10n.t("footer.reportIssue", language: languageCode), url: "https://github.com/xlch88/YouTubeTweak/issues")
            Circle()
                .fill(separatorColor)
                .frame(width: 3.5, height: 3.5)
            FooterLink(L10n.t("footer.functions", language: languageCode), url: localizedGitHubDocsURL(filename: "FUNCTIONS.md"))
            Circle()
                .fill(separatorColor)
                .frame(width: 3.5, height: 3.5)
            FooterLink(L10n.t("footer.changelog", language: languageCode), url: localizedGitHubDocsURL(filename: "CHANGELOG.md"))
            Circle()
                .fill(separatorColor)
                .frame(width: 3.5, height: 3.5)
            FooterLink(L10n.t("footer.website", language: languageCode), url: "https://yttweak.com")
        }
        .font(.system(size: 14))
        .fixedSize(horizontal: false, vertical: true)
    }

    private func localizedGitHubDocsURL(filename: String) -> String {
        let normalizedLanguageCode = languageCode ?? L10n.defaultLanguageCode
        let docsPath: String

        if normalizedLanguageCode.hasPrefix("zh") {
            docsPath = "docs/zh-cn/\(filename)"
        } else if normalizedLanguageCode.hasPrefix("ja") {
            docsPath = "docs/ja/\(filename)"
        } else {
            docsPath = filename
        }

        return "https://github.com/xlch88/YouTubeTweak/blob/main/\(docsPath)"
    }
}

private struct BuildInfoFooterView: View {
    private var title: String {
        "YouTweak V\(appVersion) (\(buildNumber))\nBuild at \(appBuildDate) · \(appCommitID)"
    }

    var body: some View {
        Button {
            #if os(macOS)
            openInSafari(appCommitURL, label: "build info link")
            #else
            AppDebugLog.write("Build info link tapped: \(appCommitURL.absoluteString)")
            UIApplication.shared.open(appCommitURL, options: [:]) { success in
                AppDebugLog.write("Opening build info link completed: \(success ? "success" : "failed")")
            }
            #endif
        } label: {
            Text(title)
                .font(.system(size: 14))
                .foregroundStyle(Color(red: 0.46, green: 0.46, blue: 0.46))
                .multilineTextAlignment(.leading)
                .lineLimit(nil)
                .fixedSize(horizontal: false, vertical: true)
        }
        .buttonStyle(.plain)
    }
}

private struct FooterLink: View {
    let title: String
    let url: String

    init(_ title: String, url: String) {
        self.title = title
        self.url = url
    }

    var body: some View {
        Button {
            if let url = URL(string: url) {
                #if os(macOS)
                openInSafari(url, label: "footer link \(title)")
                #else
                AppDebugLog.write("Footer link tapped: \(title) -> \(url.absoluteString)")
                UIApplication.shared.open(url, options: [:]) { success in
                    AppDebugLog.write("Opening footer link completed: \(success ? "success" : "failed")")
                }
                #endif
            } else {
                #if os(iOS)
                AppDebugLog.write("Invalid footer link URL: \(url)")
                #endif
            }
        } label: {
            Text(title)
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
        }
        .buttonStyle(.plain)
        .font(.system(size: 14))
        .foregroundStyle(Color(red: 0.0, green: 0.48, blue: 1.0))
    }
}
