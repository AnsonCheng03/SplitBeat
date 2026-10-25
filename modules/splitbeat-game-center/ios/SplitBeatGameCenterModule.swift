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

    AsyncFunction("loadLearnCourseProgress") { (revision: String) async throws -> [String] in
      guard GKLocalPlayer.local.isAuthenticated else {
        throw GameCenterError.notAuthenticated
      }
      guard Self.isValidCourseRevision(revision) else {
        throw GameCenterError.invalidProgressIdentity
      }

      let filenamePrefix = Self.courseProgressFilenamePrefix(revision: revision)
      let savedGames = try await GKLocalPlayer.local.fetchSavedGames()
      var snapshots: [String] = []
      for savedGame in savedGames where savedGame.name?.hasPrefix(filenamePrefix) == true {
        let data = try await savedGame.loadData()
        if let snapshot = String(data: data, encoding: .utf8) {
          snapshots.append(snapshot)
        }
      }
      return snapshots
    }

    AsyncFunction("saveLearnCourseProgress") { (revision: String, installId: String, snapshot: String) async throws -> Void in
      guard GKLocalPlayer.local.isAuthenticated else {
        throw GameCenterError.notAuthenticated
      }
      guard Self.isValidCourseRevision(revision), Self.isValidInstallId(installId) else {
        throw GameCenterError.invalidProgressIdentity
      }

      let filename = Self.courseProgressFilename(revision: revision, installId: installId)
      try await GKLocalPlayer.local.saveGameData(Data(snapshot.utf8), withName: filename)
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

  private static func courseProgressFilenamePrefix(revision: String) -> String {
    "splitbeat-learn-\(revision)-"
  }

  private static func courseProgressFilename(revision: String, installId: String) -> String {
    "\(courseProgressFilenamePrefix(revision: revision))\(installId)"
  }

  private static func isValidCourseRevision(_ revision: String) -> Bool {
    revision.range(of: #"^r-[0-9a-f]{16}$"#, options: .regularExpression) != nil
  }

  private static func isValidInstallId(_ installId: String) -> Bool {
    installId.range(of: #"^[a-z0-9-]{8,64}$"#, options: .regularExpression) != nil
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
  case invalidProgressIdentity

  var errorDescription: String? {
    switch self {
    case .notAuthenticated:
      return "Sign in to Game Center before submitting a challenge score."
    case .invalidScore:
      return "A challenge streak must be a non-negative number."
    case .invalidProgressIdentity:
      return "The course progress save identifier is invalid."
    }
  }
}
