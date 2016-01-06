require 'rmagick'

MAX_DIMENSION = 2880

def load_manipulated_image(path, mode, width, height, scale = nil)
  image = Magick::Image.read(path).first
  width = image.columns if width <= 0
  height = image.rows if height <= 0
  if scale
    width *= scale
    height *= scale
  end
  width = [MAX_DIMENSION, width].min
  height = [MAX_DIMENSION, height].min

  case mode
    when :fill
      image.resize_to_fill(width, height)
    when :fit
      image.resize_to_fit(width, height)
    when :resize
      height ||= width
      image.resize(width, height)
    else
      nil
  end
end

def process_image(path, ext_names, language=nil, site=nil)
  extname = File.extname(path).downcase
  return nil unless ext_names.include?(extname)
  image_format = extname[1..-1]

  basename = File.basename(path, extname)
  dirname = File.dirname(path)

  mode = :resize
  width = 0
  height = 0
  manipulated = false

  # Manipulated?
  if (m = dirname.match /^(?<basedir>.*)\/(?<mode>fit-|fill-)?(?<width>\d*)x?(?<height>\d*)\/(?<dir>.*)$/m)
    mode = m[:mode][0..-2].to_sym unless m[:mode].nil_or_empty?
    width = m[:width].to_i
    height = m[:height].to_i
    manipulated = width > 0 || height > 0
    dirname = m[:basedir].nil_or_empty? ? m[:dir] : File.join(m[:basedir], m[:dir])
  end

  # Assume we are returning the same resolution as we're reading.
  retina_in = retina_out = basename[-3..-1] == '_2x'

  path = nil
  if %w(hourofcode.com translate.hourofcode.com).include?(site)
    path = resolve_image File.join(language, dirname, basename)
  end
  path ||= resolve_image File.join(dirname, basename)
  unless path
    # Didn't find a match at this resolution, look for a match at the other resolution.
    if retina_out
      basename = basename[0...-3]
      retina_in = false
    else
      basename += '_2x'
      retina_in = true
    end
    path = resolve_image File.join(dirname, basename)
  end
  return nil unless path # No match at any resolution.
  output = {
    last_modified: File.mtime(path),
    content_type: image_format.to_sym,
  }

  if ((retina_in == retina_out) || retina_out) && !manipulated && File.extname(path) == extname
    # No [useful] modifications to make, return the original.
    return output.merge(file: path)
  end

  scale = 1
  if manipulated
    # Manipulated images always specify non-retina sizes in the manipulation string.
    scale = 2 if retina_out
  else
    # Retina sources need to be downsampled for non-retina output
    scale = 0.5 if retina_in && !retina_out
  end

  image = load_manipulated_image(path, mode, width, height, scale)
  image.format = image_format
  output.merge(content: image.to_blob)
end
