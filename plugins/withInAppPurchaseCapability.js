const { withXcodeProject } = require('@expo/config-plugins');

module.exports = function withInAppPurchaseCapability(config) {
  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const target = project.getFirstTarget();
    if (!target?.uuid) {
      throw new Error('Could not find the Split Beat iOS application target for In-App Purchase setup.');
    }

    const projectAttributes = project.getFirstProject().firstProject.attributes;
    const targetAttributes = projectAttributes.TargetAttributes ?? {};
    // Remove a malformed entry created by earlier versions of this plugin.
    delete targetAttributes.undefined;
    const targetSettings = targetAttributes[target.uuid] ?? {};
    const systemCapabilities = targetSettings.SystemCapabilities ?? {};

    project.addTargetAttribute(
      'SystemCapabilities',
      {
        ...systemCapabilities,
        'com.apple.InAppPurchase': { enabled: 1 },
      },
      target,
    );

    return modConfig;
  });
};
