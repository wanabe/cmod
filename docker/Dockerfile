FROM x11docker/xfce

RUN apt-get update && apt-get install -y curl gnupg libnss3 libasound2 git fakeroot rpm
RUN echo "echo bullseye" > /usr/bin/lsb_release && chmod a+x /usr/bin/lsb_release
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && apt-get install -y nodejs
RUN npm install -g yarn

# RUN apt-get install -y sudo
