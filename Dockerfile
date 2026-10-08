FROM fedora:46

RUN dnf -y install nodejs npm && \
    dnf clean all

WORKDIR /antora
RUN npm install -g --ignore-scripts gulp-cli@3.1.0
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild gifsicle optipng-bin mozjpeg

COPY gulpfile.js .gulp.json .stylelintrc .eslintrc ./
COPY gulp.d gulp.d
COPY src src
COPY preview-src preview-src

RUN useradd --system --no-create-home antora && chown -R antora /antora
USER antora
ENTRYPOINT ["gulp"]
