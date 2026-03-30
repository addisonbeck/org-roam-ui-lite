{
  description = "org-roam-ui-lite full build with npm and Emacs integration";

  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ flake-parts, nixpkgs, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ flake-parts.flakeModules.easyOverlay ];
      systems = nixpkgs.lib.platforms.all;
      perSystem = { pkgs, ... }: let
        emacsPackages = pkgs.emacsPackagesFor pkgs.emacs;
        packageJson = builtins.fromJSON (builtins.readFile ./package.json);
        nodejs = pkgs.nodejs_24;
        bundle = pkgs.buildNpmPackage {
          pname = "org-roam-ui-lite-bundle";
          version = packageJson.version;
          src = ./.;
          npmDepsHash = "sha256-QY6B62zWaKX0mgr7F8IWoK2q8PB7NMi86wtFy0hkLTY=";
          npmBuildScript = "build";
          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp -r dist/. $out/
            runHook postInstall
          '';
        };
        build = pkgs.writeShellScriptBin "org-roam-ui-lite-build" ''
          rm -rf ./dist
          cp -r --no-preserve=ownership ${bundle} ./dist
        '';
        serve = pkgs.writeShellScriptBin "org-roam-ui-lite-serve" ''
          ${nodejs}/bin/node ${bundle}/backend/dist/serve.js "$@"
        '';
        export = pkgs.writeShellScriptBin "org-roam-ui-lite-export" ''
          ${nodejs}/bin/node ${./scripts}/export.ts -r "${bundle}" "$@"
        '';
        elisp = emacsPackages.trivialBuild {
          pname = "org-roam-ui-lite-elisp";
          version = packageJson.version;
          src = ./.;
          buildInputs = [ bundle ];
          installPhase = ''
            runHook preInstall
            install -d $out/share/emacs/site-lisp/org-roam-ui-lite
            ln -s ${bundle}/emacs $out/share/emacs/site-lisp/org-roam-ui-lite/emacs
            ln -s ${bundle}/frontend $out/share/emacs/site-lisp/org-roam-ui-lite/frontend
            runHook postInstall
          '';
          packageRequires = with emacsPackages; [ org-roam simple-httpd ];
        };
        emacs = pkgs.emacs.pkgs.withPackages (epkgs: [ elisp ]);
      in
        {
          overlayAttrs = {
            org-roam-ui-lite-elisp = elisp;
            org-roam-ui-lite-serve = serve;
            org-roam-ui-lite-export = export;
          };
          packages = {
            inherit emacs elisp export serve build;
          };
          devShells.default = pkgs.mkShell {
            buildInputs = [nodejs] ++ (with pkgs; [
              typescript-language-server
            ]);
            shellHook = ''
              export bundle_ENV=development
              echo "🟢  bundle $(node -v) / npm $(npm -v) ready!"
            '';
          };
        };
    };
}
