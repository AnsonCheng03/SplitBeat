require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SplitBeatGameCenter'
  s.version        = package['version']
  s.summary        = 'Game Center challenge leaderboards for Split Beat.'
  s.description    = s.summary
  s.license        = { :type => 'MIT' }
  s.author         = 'Split Beat'
  s.homepage       = 'https://developer.apple.com/game-center/'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'GameKit'
  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
