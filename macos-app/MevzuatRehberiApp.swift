import SwiftUI
import WebKit

private let liveURL = URL(string: "https://mevzuatrehberi.mevzuatrehberi.workers.dev/?app=macos")!

final class BrowserCoordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
    let onOpenTab: (URL) -> Void
    let onRequestHome: () -> Void
    let isHome: Bool

    init(isHome: Bool, onOpenTab: @escaping (URL) -> Void, onRequestHome: @escaping () -> Void) {
        self.isHome = isHome
        self.onOpenTab = onOpenTab
        self.onRequestHome = onRequestHome
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }

        if url.scheme == "http" || url.scheme == "https" {
            if !isHome && url.host == liveURL.host && url.path == "/" {
                onRequestHome()
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        // Site yeni sekme/pencere istese de macOS uygulamasında aynı içerik alanında aç.
        if let requestURL = navigationAction.request.url {
            if requestURL.host == liveURL.host && requestURL.path == "/" {
                onRequestHome()
            } else {
                onOpenTab(requestURL)
            }
        }
        return nil
    }
}

struct RehberWebView: NSViewRepresentable {
    let url: URL
    let isHome: Bool
    let onOpenTab: (URL) -> Void
    let onRequestHome: () -> Void

    func makeCoordinator() -> BrowserCoordinator {
        BrowserCoordinator(isHome: isHome, onOpenTab: onOpenTab, onRequestHome: onRequestHome)
    }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.setValue(false, forKey: "drawsBackground")
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {}
}

struct BrowserTab: Identifiable, Equatable {
    let id: UUID
    let url: URL
    var title: String
    var isHome: Bool { url.host == liveURL.host && url.path == "/" }

    init(url: URL, title: String) {
        self.id = UUID()
        self.url = url
        self.title = title
    }
}

@main
struct MevzuatRehberiApp: App {
    @State private var tabs = [BrowserTab(url: liveURL, title: "Mevzuat Rehberi")]
    @State private var selectedTab: UUID?

    var body: some Scene {
        WindowGroup("Mevzuat Rehberi") {
            VStack(spacing: 0) {
                HStack(spacing: 4) {
                    ForEach(tabs) { tab in
                        HStack(spacing: 6) {
                            Button(tab.title) { selectedTab = tab.id }
                                .buttonStyle(.plain)
                            if !tab.isHome {
                                Button { closeTab(tab.id) } label: {
                                    Image(systemName: "xmark")
                                        .font(.system(size: 10, weight: .bold))
                                }
                                .buttonStyle(.plain)
                                .help("Sekmeyi kapat")
                            }
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(selectedTab == tab.id ? Color.accentColor.opacity(0.18) : Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: 7))
                    }
                    Spacer()
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                Divider()

                if let tab = tabs.first(where: { $0.id == selectedTab }) {
                    RehberWebView(url: tab.url, isHome: tab.isHome, onOpenTab: addTab, onRequestHome: returnHome)
                }
            }
            .frame(minWidth: 1100, minHeight: 720)
            .onAppear {
                if selectedTab == nil { selectedTab = tabs[0].id }
            }
        }
        .windowResizability(.contentSize)
    }

    private func returnHome() {
        if let home = tabs.first(where: { $0.isHome }) {
            selectedTab = home.id
        } else {
            let home = BrowserTab(url: liveURL, title: "Mevzuat Rehberi")
            tabs.insert(home, at: 0)
            selectedTab = home.id
        }
    }

    private func closeTab(_ id: UUID) {
        guard let tab = tabs.first(where: { $0.id == id }), !tab.isHome else { return }
        tabs.removeAll { $0.id == id }
        if selectedTab == id { returnHome() }
    }

    private func addTab(_ url: URL) {
        guard url.scheme == "http" || url.scheme == "https" else { return }
        if url.host == liveURL.host && url.path == "/" {
            returnHome()
            return
        }
        let title = url.path.contains("ipc") ? "İPC 2026" : url.path.contains("mevzuat") ? "Mevzuat" : "Mevzuat Rehberi"
        let newTab = BrowserTab(url: url, title: title)
        tabs.append(newTab)
        selectedTab = newTab.id
    }
}
