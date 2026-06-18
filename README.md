# ChicagoShots Static Site

This folder is ready for GitHub Pages.

## Publish on GitHub

1. Create a GitHub repository, for example `chicagoshots`.
2. Upload everything in this folder to the repository root.
3. In GitHub, open **Settings > Pages**.
4. Set the source to the `main` branch and `/root`.
5. Keep the included `CNAME` file so GitHub Pages knows the custom domain is `chicagoshots.com`.

## DNS at Porkbun

Point the apex domain to GitHub Pages:

```text
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   YOUR_GITHUB_USERNAME.github.io
```

Replace `YOUR_GITHUB_USERNAME` with the account that owns the GitHub Pages repo.

After DNS updates, go back to GitHub Pages and enable **Enforce HTTPS** once GitHub finishes checking the domain.

## Notes

Webflow's official code export was blocked by a workspace upgrade prompt, so this is a rebuilt static version based on the public ChicagoShots positioning and domain. If you later export the Webflow ZIP, its files can replace this folder.
