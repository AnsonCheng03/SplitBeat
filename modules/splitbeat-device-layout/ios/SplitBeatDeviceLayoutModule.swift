import ExpoModulesCore
import UIKit

public final class SplitBeatDeviceLayoutModule: Module {
  private weak var observedView: UIView?
  private var hingeInteraction: UIInteraction?
  private var orientationObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("SplitBeatDeviceLayout")

    Events("onReservedRegionsChanged")

    Function("getReservedRegions") { () -> [String: Any] in
      self.performOnMainThread { self.reservedRegions() }
    }

    OnStartObserving {
      self.startObserving()
    }

    OnStopObserving {
      self.stopObserving()
    }
  }

  private func startObserving() {
    DispatchQueue.main.async { [weak self] in
      guard let self, let view = self.currentView() else { return }
      self.observedView = view
      self.attachHingeInteraction(to: view)
      self.orientationObserver = NotificationCenter.default.addObserver(
        forName: UIDevice.orientationDidChangeNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.sendReservedRegionsChanged()
      }
      self.sendReservedRegionsChanged()
    }
  }

  private func stopObserving() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      if let hingeInteraction = self.hingeInteraction {
        self.observedView?.removeInteraction(hingeInteraction)
      }
      self.hingeInteraction = nil
      self.observedView = nil
      if let orientationObserver = self.orientationObserver {
        NotificationCenter.default.removeObserver(orientationObserver)
      }
      self.orientationObserver = nil
    }
  }

  private func attachHingeInteraction(to view: UIView) {
    guard #available(iOS 27.1, *) else { return }

    let interaction = UIHingeInteraction { [weak self, weak view] _, _ in
      guard let self, let view else { return }
      self.sendReservedRegionsChanged(from: view)
    }
    view.addInteraction(interaction)
    hingeInteraction = interaction
  }

  private func sendReservedRegionsChanged(from view: UIView? = nil) {
    let sourceView = view ?? observedView
    guard let sourceView else { return }
    let regions = reservedRegions(from: sourceView)
    sendEvent("onReservedRegionsChanged", regions)
  }

  private func reservedRegions() -> [String: Any] {
    guard let view = currentView() else { return emptyRegions() }
    return reservedRegions(from: view)
  }

  private func reservedRegions(from view: UIView) -> [String: Any] {
    guard #available(iOS 27.1, *) else { return emptyRegions() }

    return [
      "division": view.reservedRegions(kind: .division).map(regionFrame),
      "occlusion": view.reservedRegions(kind: .occlusion).map(regionFrame),
      "width": view.bounds.width,
      "height": view.bounds.height,
    ]
  }

  @available(iOS 27.1, *)
  private func regionFrame(_ region: UIView.ReservedRegion) -> [String: CGFloat] {
    [
      "x": region.frame.minX,
      "y": region.frame.minY,
      "width": region.frame.width,
      "height": region.frame.height,
    ]
  }

  private func currentView() -> UIView? {
    appContext?.utilities?.currentViewController()?.view
  }

  private func emptyRegions() -> [String: Any] {
    ["division": [], "occlusion": [], "width": 0, "height": 0]
  }

  private func performOnMainThread<T>(_ operation: () -> T) -> T {
    if Thread.isMainThread { return operation() }
    return DispatchQueue.main.sync(execute: operation)
  }
}
