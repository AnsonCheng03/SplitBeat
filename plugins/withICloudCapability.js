const { withXcodeProject } = require('@expo/config-plugins');

module.exports = function withICloudCapability(config) {
  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const target = project.getFirstTarget();
    if (!target?.uuid) {
      throw new Error('Could not find the Split Beat iOS application target for iCloud setup.');
    }

    const projectAttributes = project.getFirstProject().firstProject.attributes;
    const targetAttributes = projectAttributes.TargetAttributes ?? {};
    delete targetAttributes.undefined;
    const targetSettings = targetAttributes[target.uuid] ?? {};
    const systemCapabilities = targetSettings.SystemCapabilities ?? {};

    project.addTargetAttribute(
      'SystemCapabilities',
      {
        ...systemCapabilities,
        'com.apple.iCloud': { enabled: 1 },
      },
      target,
    );

    return modConfig;
  });
};
