import ExpoModulesCore
import GameKit
import UIKit

private let longestCorrectStreakLeaderboardID = "com.splitbeat.twohandrhythm.longest-correct-streak"

public final class SplitBeatGameCenterModule: Module {
  private let gameCenterDelegate = GameCenterControllerDelegate()

  public func definition() -> ModuleDefinition {
    Name("SplitBeatGameCenter")

    Events("onAuthenticationChanged")

    Function("getStatus") { () -> [String: Any] in
      self.authenticationStatus()
    }

    Function("authenticate") {
      self.authenticateLocalPlayer()
    }

    AsyncFunction("submitLongestStreak") { (score: Int) async throws -> Void in
      guard GKLocalPlayer.local.isAuthenticated else {
        throw GameCenterError.notAuthenticated
      }
      guard score >= 0 else {
        throw GameCenterError.invalidScore
      }

      try await GKLeaderboard.submitScore(
        score,
        context: 0,
        player: GKLocalPlayer.local,
        leaderboardIDs: [longestCorrectStreakLeaderboardID]
      )
    }

    Function("showLeaderboard") { () -> Bool in
      guard GKLocalPlayer.local.isAuthenticated else {
        return false
      }
      DispatchQueue.main.async {
        guard let presenter = self.appContext?.utilities?.currentViewController() else {
          return
        }
        let controller = GKGameCenterViewController(
          leaderboardID: longestCorrectStreakLeaderboardID,
          playerScope: .global,
          timeScope: .allTime
        )
        controller.gameCenterDelegate = self.gameCenterDelegate
        presenter.present(controller, animated: true)
      }
      return true
    }
  }

  private func authenticateLocalPlayer() {
    GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, error in
      guard let self else { return }
      if let viewController {
        DispatchQueue.main.async {
          guard let presenter = self.appContext?.utilities?.currentViewController() else {
            self.sendAuthenticationStatus(error: error)
            return
          }
          presenter.present(viewController, animated: true)
        }
        return
      }
      self.sendAuthenticationStatus(error: error)
    }
  }

  private func authenticationStatus(error: Error? = nil) -> [String: Any] {
    var status: [String: Any] = [
      "available": true,
      "authenticated": GKLocalPlayer.local.isAuthenticated,
      "playerAlias": GKLocalPlayer.local.isAuthenticated ? GKLocalPlayer.local.alias : "",
      "leaderboardID": longestCorrectStreakLeaderboardID,
    ]
    if let error {
      status["error"] = error.localizedDescription
    }
    return status
  }

  private func sendAuthenticationStatus(error: Error?) {
    sendEvent("onAuthenticationChanged", authenticationStatus(error: error))
  }

}

private final class GameCenterControllerDelegate: NSObject, GKGameCenterControllerDelegate {
  func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
    gameCenterViewController.dismiss(animated: true)
  }
}

private enum GameCenterError: Error, LocalizedError {
  case notAuthenticated
  case invalidScore

  var errorDescription: String? {
    switch self {
    case .notAuthenticated:
      return "Sign in to Game Center before submitting a challenge score."
    case .invalidScore:
      return "A challenge streak must be a non-negative number."
    }
  }
}
