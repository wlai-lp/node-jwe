# Wei - README
this is a standalone JWE implementation using native nodejs crypto library
the POC works in theory if you run node jweencrypt.js in this current commit
it shows a encrypted JWE, (looks right, but does no decrypt currectly https://dinochiesa.github.io/jwt/)
i think it gave a false sense that it works...

it seems to me that the decrypt AES key part doesn't work right, WIP