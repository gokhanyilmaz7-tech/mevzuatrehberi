import AppKit
import SwiftUI
import WebKit

private let appScheme = "mevzuat"
private let homeURL = URL(string: "mevzuat://bundle/")!

final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL

    init(root: URL) { self.root = root }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let requestURL = urlSchemeTask.request.url else { return }
        let relativePath = requestURL.path == "/" ? "index.html" : String(requestURL.path.dropFirst())
        let candidate = root.appendingPathComponent(relativePath).standardizedFileURL
        guard candidate.path.hasPrefix(root.standardizedFileURL.path + "/"),
              FileManager.default.fileExists(atPath: candidate.path) else {
            urlSchemeTask.didReceive(HTTPURLResponse(url: requestURL, statusCode: 404, httpVersion: nil, headerFields: nil)!)
            urlSchemeTask.didFinish()
            return
        }

        do {
            let data = try Data(contentsOf: candidate)
            let mime = Self.mimeType(for: candidate.pathExtension)
            let response = HTTPURLResponse(url: requestURL, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": mime, "Cache-Control": "no-cache"])!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private static func mimeType(for extensionName: String) -> String {
        switch extensionName.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "webp": return "image/webp"
        case "jpg", "jpeg": return "image/jpeg"
        case "pdf": return "application/pdf"
        default: return "application/octet-stream"
        }
    }
}

final class BrowserCoordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    let tabID: UUID
    let isHome: () -> Bool
    let onOpenTab: (URL) -> Void
    let onRequestHome: () -> Void
    let onCloseTab: () -> Void
    let onTitle: (String) -> Void

    init(tabID: UUID, isHome: @escaping () -> Bool, onOpenTab: @escaping (URL) -> Void,
         onRequestHome: @escaping () -> Void, onCloseTab: @escaping () -> Void,
         onTitle: @escaping (String) -> Void) {
        self.tabID = tabID
        self.isHome = isHome
        self.onOpenTab = onOpenTab
        self.onRequestHome = onRequestHome
        self.onCloseTab = onCloseTab
        self.onTitle = onTitle
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "openTab", "openMevzuat", "openIPC":
            if let value = message.body as? String, let url = URL(string: value) { onOpenTab(url) }
        case "openHome": onRequestHome()
        case "closeTab": onCloseTab()
        default: break
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let title = webView.title, !title.isEmpty { onTitle(title) }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak webView] in
            if let title = webView?.title, !title.isEmpty { self.onTitle(title) }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }

        if navigationAction.targetFrame == nil {
            onOpenTab(url)
            decisionHandler(.cancel)
            return
        }
        if url.scheme == appScheme {
            if !isHome() && url.path == "/" { onRequestHome(); decisionHandler(.cancel) } else { decisionHandler(.allow) }
            return
        }
        if ["http", "https", "mailto"].contains(url.scheme?.lowercased() ?? "") {
            NSWorkspace.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { onOpenTab(url) }
        return nil
    }
}

final class WebViewStore {
    private var views: [UUID: WKWebView] = [:]
    private var coordinators: [UUID: BrowserCoordinator] = [:]
    private let schemeHandler: BundleSchemeHandler

    init() {
        let root = Bundle.main.resourceURL!.appendingPathComponent("web", isDirectory: true)
        schemeHandler = BundleSchemeHandler(root: root)
    }

    func webView(for tab: BrowserTab, onOpenTab: @escaping (URL) -> Void,
                 onRequestHome: @escaping () -> Void, onCloseTab: @escaping () -> Void,
                 onTitle: @escaping (String) -> Void) -> WKWebView {
        if let view = views[tab.id] { return view }
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.setURLSchemeHandler(schemeHandler, forURLScheme: appScheme)
        let bridge = """
        (() => {
          const post = (name, value) => window.webkit.messageHandlers[name]?.postMessage(value);
          window.open = (url) => { post('openTab', new URL(url, window.location.href).href); return null; };
          document.addEventListener('click', (event) => {
            const link = event.target.closest?.('#home-return');
            if (link) { event.preventDefault(); post('openHome', null); }
          }, true);
        })();
        """
        configuration.userContentController.addUserScript(WKUserScript(source: bridge, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        let coordinator = BrowserCoordinator(tabID: tab.id, isHome: { tab.isHome }, onOpenTab: onOpenTab,
                                              onRequestHome: onRequestHome, onCloseTab: onCloseTab, onTitle: onTitle)
        ["openTab", "openMevzuat", "openIPC", "openHome", "closeTab"].forEach {
            configuration.userContentController.add(coordinator, name: $0)
        }
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = coordinator
        view.uiDelegate = coordinator
        view.allowsBackForwardNavigationGestures = true
        view.setValue(false, forKey: "drawsBackground")
        views[tab.id] = view
        coordinators[tab.id] = coordinator
        view.load(URLRequest(url: tab.url))
        return view
    }

    func remove(_ id: UUID) { views[id]?.stopLoading(); views.removeValue(forKey: id); coordinators.removeValue(forKey: id) }
}

struct BrowserTab: Identifiable, Equatable {
    let id: UUID
    let url: URL
    var title: String
    var isHome: Bool { url.scheme == appScheme && url.path == "/" }
    init(url: URL, title: String) { id = UUID(); self.url = url; self.title = title }
}

struct WebViewHost: NSViewRepresentable {
    let tab: BrowserTab
    let store: WebViewStore
    let onOpenTab: (URL) -> Void
    let onRequestHome: () -> Void
    let onCloseTab: () -> Void
    let onTitle: (String) -> Void

    func makeNSView(context: Context) -> NSView { NSView(frame: .zero) }
    func updateNSView(_ container: NSView, context: Context) {
        let view = store.webView(for: tab, onOpenTab: onOpenTab, onRequestHome: onRequestHome, onCloseTab: onCloseTab, onTitle: onTitle)
        if view.superview !== container {
            view.removeFromSuperview()
            container.subviews.forEach { $0.removeFromSuperview() }
            container.addSubview(view)
            view.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([view.leadingAnchor.constraint(equalTo: container.leadingAnchor), view.trailingAnchor.constraint(equalTo: container.trailingAnchor), view.topAnchor.constraint(equalTo: container.topAnchor), view.bottomAnchor.constraint(equalTo: container.bottomAnchor)])
        }
    }
}

@main
struct MevzuatRehberiApp: App {
    @State private var tabs = [BrowserTab(url: homeURL, title: "Mevzuat Rehberi")]
    @State private var selectedTab: UUID?
    @State private var webViewStore = WebViewStore()

    var body: some Scene {
        WindowGroup("Mevzuat Rehberi") {
            VStack(spacing: 0) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 4) {
                        ForEach(tabs) { tab in
                            HStack(spacing: 6) {
                                Button(tab.title) { selectedTab = tab.id }.buttonStyle(.plain).lineLimit(1)
                                if !tab.isHome {
                                    Button { closeTab(tab.id) } label: { Image(systemName: "xmark").font(.system(size: 10, weight: .bold)) }.buttonStyle(.plain).help("Sekmeyi kapat")
                                }
                            }
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(selectedTab == tab.id ? Color.accentColor.opacity(0.18) : Color.clear)
                            .clipShape(RoundedRectangle(cornerRadius: 7))
                        }
                    }.padding(.horizontal, 10).padding(.vertical, 6)
                }
                Divider()
                if let tab = tabs.first(where: { $0.id == selectedTab }) {
                    WebViewHost(tab: tab, store: webViewStore, onOpenTab: addTab, onRequestHome: returnHome,
                                onCloseTab: { closeTab(tab.id) }, onTitle: { updateTitle(tab.id, title: $0) })
                }
            }
            .frame(minWidth: 1100, minHeight: 720)
            .onAppear { if selectedTab == nil { selectedTab = tabs[0].id } }
        }.windowResizability(.contentSize)
    }

    private func returnHome() { selectedTab = tabs.first(where: { $0.isHome })?.id ?? tabs[0].id }

    private func closeTab(_ id: UUID) {
        guard let index = tabs.firstIndex(where: { $0.id == id }), !tabs[index].isHome else { return }
        let wasSelected = selectedTab == id
        webViewStore.remove(id)
        tabs.remove(at: index)
        if wasSelected { selectedTab = tabs[min(index - 1, tabs.count - 1)].id }
    }

    private func addTab(_ url: URL) {
        guard url.scheme == appScheme else { if ["http", "https"].contains(url.scheme) { NSWorkspace.shared.open(url) }; return }
        if url.path == "/" { returnHome(); return }
        if let existing = tabs.first(where: { $0.url.absoluteString == url.absoluteString }) { selectedTab = existing.id; return }
        let title = url.path.contains("ipc") ? "İPC 2026" : "Mevzuat"
        let tab = BrowserTab(url: url, title: title)
        tabs.append(tab); selectedTab = tab.id
    }

    private func updateTitle(_ id: UUID, title: String) {
        guard let index = tabs.firstIndex(where: { $0.id == id }), !title.isEmpty else { return }
        tabs[index].title = tabs[index].url.path.contains("ipc") ? "İPC 2026" : title
    }
}
