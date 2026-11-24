{
  description = "Development environment for webuntis-api";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-infra-modules = {
      url = "github:HaukeSchnau/nix-infra-modules/b365d13637b9dc83c397df542b5112a50ac8cbb9";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    { nixpkgs, nix-infra-modules, ... }:
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
          toolchain = builtins.attrValues (nix-infra-modules.lib.toolchain { inherit pkgs; });
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
