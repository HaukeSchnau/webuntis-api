{
  description = "Development environment for webuntis-api";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    projects-sdk = {
      url = "github:HaukeSchnau/projects-sdk/v0.1.0";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    { nixpkgs, projects-sdk, ... }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          toolchain = builtins.attrValues (projects-sdk.lib.toolchain { inherit pkgs; });
        in
        {
          ci = pkgs.mkShellNoCC { packages = toolchain; };

          default = pkgs.mkShellNoCC {
            packages =
              toolchain
              ++ (with pkgs; [
                age
                just
                sops
              ]);

            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"
            '';
          };
        }
      );
    };
}
