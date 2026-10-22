const { withMainActivity } = require('@expo/config-plugins');

const EVENT_NAME = 'SplitBeatHardwareKeyPress';
const KEY_EVENT_IMPORT = 'import android.view.KeyEvent';
const CLOCK_IMPORT = 'import android.os.SystemClock';
const ARGUMENTS_IMPORT = 'import com.facebook.react.bridge.Arguments';
const EMITTER_IMPORT = 'import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter';

function addImport(contents, importLine) {
  if (contents.includes(`${importLine}\n`)) return contents;
  return contents.replace(/^(package [^\n]+\n)/, `$1\n${importLine}`);
}

function withAndroidHardwareKeyboard(config) {
  return withMainActivity(config, (modConfig) => {
    if (modConfig.modResults.language !== 'kt') {
      throw new Error('Split Beat hardware keyboard support expects a Kotlin MainActivity.');
    }

    let contents = modConfig.modResults.contents;
    const classDeclaration = 'class MainActivity : ReactActivity() {';
    const dispatchMethod = 'override fun dispatchKeyEvent(event: KeyEvent): Boolean {';

    if (!contents.includes(dispatchMethod)) {
      if (!contents.includes(classDeclaration)) {
        throw new Error('Could not find MainActivity class declaration for Split Beat hardware keyboard support.');
      }

      const keyDispatch = [
        '',
        '  override fun dispatchKeyEvent(event: KeyEvent): Boolean {',
        '    if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {',
        '      val unicodeCharacter = event.unicodeChar',
        '      if (unicodeCharacter != 0) {',
        '        val payload = Arguments.createMap().apply {',
        '          putString("key", unicodeCharacter.toChar().toString())',
        '          putDouble("eventTimeMs", event.eventTime.toDouble())',
        '          putDouble("nativeTimeMs", SystemClock.uptimeMillis().toDouble())',
        '        }',
        '        reactHost.currentReactContext',
        '          ?.getJSModule(RCTDeviceEventEmitter::class.java)',
        `          ?.emit("${EVENT_NAME}", payload)`,
        '      }',
        '    }',
        '    return super.dispatchKeyEvent(event)',
        '  }',
      ].join('\n');

      contents = contents.replace(classDeclaration, `${classDeclaration}${keyDispatch}`);
    }

    contents = addImport(contents, KEY_EVENT_IMPORT);
    contents = addImport(contents, CLOCK_IMPORT);
    contents = addImport(contents, ARGUMENTS_IMPORT);
    contents = addImport(contents, EMITTER_IMPORT);

    modConfig.modResults.contents = contents;
    return modConfig;
  });
}

module.exports = withAndroidHardwareKeyboard;
